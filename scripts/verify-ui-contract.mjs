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

        if (tagName === "input" && (type === "date" || type === "time")) {
          failures.push(`${relativePath(filePath)}:${getLine(sourceFile, node)} 공용 날짜·시간 popover 대신 네이티브 ${type} 입력을 사용합니다.`);
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

  if (source.includes("text-[9px]")) {
    failures.push(`${relativePath(filePath)} 모바일에서 읽기 어려운 9px 텍스트를 사용합니다.`);
  }

  if (source.includes("semo-page-shell")) {
    failures.push(`${relativePath(filePath)} 정의되지 않은 semo-page-shell 레이아웃 클래스를 사용합니다.`);
  }

  if (source.includes("@material-tailwind/react")) {
    failures.push(`${relativePath(filePath)} 공용 디자인 계약 밖의 Material Tailwind 컴포넌트를 사용합니다.`);
  }

  if (source.includes("useReducedMotion")) {
    failures.push(`${relativePath(filePath)} hydration-safe 공용 reduced motion 훅을 거치지 않습니다.`);
  }

  if (path.basename(filePath) === "BasicToast.tsx" && source.includes("<RouteModal")) {
    failures.push(`${relativePath(filePath)} 토스트가 비차단 피드백 대신 모달로 구현돼 있습니다.`);
  }

  if (/role\s*=\s*["']button["']/.test(source)) {
    failures.push(`${relativePath(filePath)} 비네이티브 role=button 대신 button 또는 링크를 사용해야 합니다.`);
  }

  if (/\bwindow\.confirm\s*\(/.test(source)) {
    failures.push(`${relativePath(filePath)} 전역 confirm 대신 브라우저 window.confirm을 사용합니다.`);
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
const maxTinyTextCount = 0;

if (tinyTextCount > maxTinyTextCount) {
  failures.push(`11px 보조 텍스트가 기준 ${maxTinyTextCount}건을 초과했습니다: ${tinyTextCount}건`);
}

const globalStyles = fs.readFileSync(path.join(APP_DIRECTORY, "globals.css"), "utf8");
for (const requiredToken of [
  "--color-bg:",
  "--secondary:",
  "--font-app-display:",
  "--radius-card:",
  "--shadow-card:",
  "--duration-normal:",
  "--page-user:",
  "--page-admin:",
]) {
  if (!globalStyles.includes(requiredToken)) {
    failures.push(`app/globals.css에 필수 디자인 토큰 ${requiredToken.slice(0, -1)}이 없습니다.`);
  }
}

const providersSource = fs.readFileSync(path.join(APP_DIRECTORY, "providers.tsx"), "utf8");
if (!providersSource.includes("<SemoMotionField />")) {
  failures.push("app/providers.tsx가 전역 SemoMotionField를 렌더링하지 않습니다.");
}
if (!providersSource.includes('MotionConfig reducedMotion="user"')) {
  failures.push("app/providers.tsx가 사용자 reduced motion 설정을 따르지 않습니다.");
}

for (const summaryCoreFile of [
  "page.tsx",
  "home/DiscoverSection.tsx",
  "home/DiscoverClubModal.tsx",
]) {
  const source = fs.readFileSync(path.join(APP_DIRECTORY, summaryCoreFile), "utf8");
  if (!source.includes('presentation="core-only"')) {
    failures.push(`${summaryCoreFile}가 외부 요약 문맥에서 코어 보석만 표시하지 않습니다.`);
  }
}

const growthPanelSource = fs.readFileSync(
  path.join(APP_DIRECTORY, "components/ClubGrowthCorePanel.tsx"),
  "utf8",
);
if (growthPanelSource.includes('presentation="core-only"')) {
  failures.push("클럽 내부 성장 패널이 바깥 성장 삼각을 숨깁니다.");
}

const growthMarkSource = fs.readFileSync(
  path.join(APP_DIRECTORY, "components/ClubGrowthCoreMark.tsx"),
  "utf8",
);
for (const stageContract of [
  "TIER_STAGE_GUIDES.map",
  "data-tier-stage={stage}",
  'strokeDasharray="3 4"',
]) {
  if (!growthMarkSource.includes(stageContract)) {
    failures.push(`클럽 내부 성장 마크가 3단계 점선 계약 ${stageContract}을 지키지 않습니다.`);
  }
}

console.log(`SEMO UI 계약 검사: ${routeCount}개 라우트, ${files.length}개 TSX, 11px 보조 텍스트 ${tinyTextCount}/${maxTinyTextCount}건`);

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Semo UI contract checks passed.");
}
