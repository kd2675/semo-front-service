export const MODE_SWITCH_FAB_BOTTOM_CLASS_NAME = "bottom-24";
export const STACKED_ACTION_FAB_BOTTOM_CLASS_NAME = "bottom-40";
export const FAB_RIGHT_OFFSET_CLASS_NAME = "right-6";

export function getActionFabBottomClass(hasModeSwitchFab: boolean) {
  return hasModeSwitchFab
    ? STACKED_ACTION_FAB_BOTTOM_CLASS_NAME
    : MODE_SWITCH_FAB_BOTTOM_CLASS_NAME;
}
