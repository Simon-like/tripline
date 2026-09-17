import { useState } from 'react';
import { useTriplineTheme } from '../theme';

/**
 * 轻量焦点边框态（P0c 表单三件套）：
 * focused → primary 描边（1 → 1.5）；invalid → accent 系；失焦还原。
 * 用法：const field = useFocusField(invalid);
 *   <TextInput {...field.focusProps} style={[baseStyle, field.borderStyle]} />
 * field.focused 同时可用于金额千分位的「失焦格式化、聚焦还原」切换。
 */
export function useFocusField(invalid = false) {
  const { theme } = useTriplineTheme();
  const [focused, setFocused] = useState(false);
  return {
    focused,
    borderStyle: {
      borderColor: invalid ? theme.accent : focused ? theme.primary : theme.border,
      borderWidth: focused || invalid ? 1.5 : 1,
    },
    focusProps: {
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    },
  } as const;
}
