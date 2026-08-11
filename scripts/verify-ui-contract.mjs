import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

const APP_DIRECTORY = path.resolve("app");
const FORM_FIELD_NAMES = new Set(["input", "select", "textarea"]);
const INTERACTIVE_NAMES = new Set(["a", "button", "Link", "RouterLink"]);
const SMALL_EXPLICIT_SIZE_PATTERN = /(?:^|[^\w-])(?:h|size)-(?:[4-9]|10)(?!\d)/;
const VALID_TOUCH_SIZE_PATTERN = /(?:^|[^\w-])(?:h|size|min-h)-(?:11|12|14|16)(?!\d)|min-h-\[44px\]/;

function collectFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectFiles(absolutePath);
    }

    return entry.isFile() && entry.name.endsWith(".tsx") ? [absolutePath] : [];
  });
}

function getTagName(node) {
  return node.tagName.getText();
}

function getAttribute(node, attributeName) {
  return node.attributes.properties.find(
    (property) => ts.isJsxAttribute(property) && property.name.getText() === attributeName,
  );
}

function getStaticAttributeValue(attribute) {
  if (attribute == null || attribute.initializer == null) {
    return null;
  }

  if (ts.isStringLiteral(attribute.initializer)) {
    return attribute.initializer.text;
  }

  if (
    ts.isJsxExpression(attribute.initializer)
    && attribute.initializer.expression != null
    && ts.isStringLiteralLike(attribute.initializer.expression)
  ) {
    return attribute.initializer.expression.text;
  }

  return null;
}

function isMaterialIconElement(node) {
  if (!ts.isJsxElement(node)) {
    return false;
  }

  const className = getStaticAttributeValue(getAttribute(node.openingElement, "className"));
  return className?.includes("material-symbols-outlined") ?? false;
}

function hasMeaningfulInteractiveContent(node) {
  return node.children.some((child) => {
    if (ts.isJsxText(child)) {
      return child.text.trim().length > 0;
    }
    if (ts.isJsxExpression(child)) {
      return child.expression != null;
    }
    if (ts.isJsxSelfClosingElement(child)) {
      return true;
    }
    if (ts.isJsxElement(child)) {
      return !isMaterialIconElement(child) && hasMeaningfulInteractiveContent(child);
    }
    return false;
  });
}

function hasMeaningfulLabelContent(node) {
  return node.children.some((child) => {
    if (ts.isJsxText(child)) {
      return child.text.trim().length > 0;
    }
    if (ts.isJsxExpression(child)) {
      return child.expression != null;
    }
    if (ts.isJsxElement(child)) {
      return hasMeaningfulLabelContent(child);
    }
    return false;
  });
}

function hasImplicitLabel(node) {
  let parent = node.parent;

  while (parent != null) {
    if (ts.isJsxElement(parent) && getTagName(parent.openingElement) === "label") {
      return hasMeaningfulLabelContent(parent);
    }

    parent = parent.parent;
  }

  return false;
}

function getLine(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function relativePath(filePath) {
  return path.relative(process.cwd(), filePath);
}

const files = collectFiles(APP_DIRECTORY);
const failures = [];
let routeCount = 0;

for (const filePath of files) {
  const source = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const explicitLabelTargets = new Set();

  if (path.basename(filePath) === "page.tsx") {
    routeCount += 1;
  }

  function collectLabels(node) {
    if (ts.isJsxOpeningElement(node) && getTagName(node) === "label") {
      const htmlForAttribute = getAttribute(node, "htmlFor");
      const htmlFor = getStaticAttributeValue(htmlForAttribute)
        ?? htmlForAttribute?.initializer?.getText(sourceFile)
        ?? null;

      if (htmlFor != null) {
        explicitLabelTargets.add(htmlFor);
      }
    }

    ts.forEachChild(node, collectLabels);
  }

  collectLabels(sourceFile);

  function inspect(node) {
    if (ts.isJsxElement(node) && INTERACTIVE_NAMES.has(getTagName(node.openingElement))) {
      const hasAccessibleName = getAttribute(node.openingElement, "aria-label") != null
        || getAttribute(node.openingElement, "aria-labelledby") != null
        || hasMeaningfulInteractiveContent(node);

      if (!hasAccessibleName) {
        failures.push(`${relativePath(filePath)}:${getLine(sourceFile, node)} 아이콘 전용 조작 요소에 접근성 이름이 없습니다.`);
      }
    }

    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = getTagName(node);
      const classNameValue = getStaticAttributeValue(getAttribute(node, "className"));

      if (
        tagName === "span"
        && classNameValue?.includes("material-symbols-outlined")
        && getAttribute(node, "aria-hidden") == null
      ) {
        failures.push(`${relativePath(filePath)}:${getLine(sourceFile, node)} 장식 아이콘이 접근성 이름에 노출됩니다.`);
      }

      if (FORM_FIELD_NAMES.has(tagName)) {
        const type = getStaticAttributeValue(getAttribute(node, "type"));
        const idAttribute = getAttribute(node, "id");
        const id = getStaticAttributeValue(idAttribute)
          ?? idAttribute?.initializer?.getText(sourceFile)
          ?? null;
        const hasAccessibleName = getAttribute(node, "aria-label") != null
          || getAttribute(node, "aria-labelledby") != null
          || (id != null && explicitLabelTargets.has(id))
          || hasImplicitLabel(node);

        if (type !== "hidden" && !hasAccessibleName) {
          failures.push(`${relativePath(filePath)}:${getLine(sourceFile, node)} 폼 필드에 접근성 이름이 없습니다.`);
        }
      }

      if (INTERACTIVE_NAMES.has(tagName)) {
        const className = getAttribute(node, "className")?.initializer?.getText(sourceFile) ?? "";
        const ariaLabel = getStaticAttributeValue(getAttribute(node, "aria-label"));

        if (
          SMALL_EXPLICIT_SIZE_PATTERN.test(className)
          && !VALID_TOUCH_SIZE_PATTERN.test(className)
        ) {
          failures.push(`${relativePath(filePath)}:${getLine(sourceFile, node)} 조작 영역이 44px보다 작게 명시됐습니다.`);
        }

        if (
          tagName === "button"
          && ariaLabel?.includes("닫기")
          && !className.includes("semo-icon-control")
          && !VALID_TOUCH_SIZE_PATTERN.test(className)
        ) {
          failures.push(`${relativePath(filePath)}:${getLine(sourceFile, node)} 닫기 버튼의 조작 영역이 44px보다 작습니다.`);
        }
      }
    }

    ts.forEachChild(node, inspect);
  }

  inspect(sourceFile);

  if (path.basename(filePath).includes("Fallback") && /router\.replace\s*\(/.test(source)) {
    failures.push(`${relativePath(filePath)} fallback이 실패 상태에서 자동 이동합니다.`);
  }

  if (filePath !== path.join(APP_DIRECTORY, "layout.tsx") && source.includes("next/font/google")) {
    failures.push(`${relativePath(filePath)} 루트 외부에서 웹폰트를 다시 로드합니다.`);
  }

  if (source.includes("text-[10px]")) {
    failures.push(`${relativePath(filePath)} 모바일에서 읽기 어려운 10px 텍스트를 사용합니다.`);
  }

  const hasModalPresentation = source.includes('presentation === "modal"');
  const hasPageHeader = source.includes("<ClubPageHeader");
  const hasModalHeaderLayout = /layout=\{isModal\s*\?\s*"modal"\s*:\s*"page"\}/.test(source)
    || source.includes('layout="modal"');

  if (hasModalPresentation && hasPageHeader && !hasModalHeaderLayout) {
    failures.push(`${relativePath(filePath)} 모달 프레젠테이션 헤더가 페이지 폭 제한을 해제하지 않습니다.`);
  }
}

const tinyTextCount = files.reduce((count, filePath) => {
  const source = fs.readFileSync(filePath, "utf8");
  return count + (source.match(/text-\[11px\]/g)?.length ?? 0);
}, 0);
const maxTinyTextCount = 222;

if (tinyTextCount > maxTinyTextCount) {
  failures.push(`11px 보조 텍스트가 기준 ${maxTinyTextCount}건을 초과했습니다: ${tinyTextCount}건`);
}

console.log(`SEMO UI 계약 검사: ${routeCount}개 라우트, ${files.length}개 TSX, 11px 보조 텍스트 ${tinyTextCount}/${maxTinyTextCount}건`);

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Semo UI contract checks passed.");
}
