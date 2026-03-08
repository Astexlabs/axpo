import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react-native';
import { cssInterop } from 'nativewind';

// Enable NativeWind className support on the SVG root
cssInterop(HugeiconsIcon, {
  className: {
    target: 'style',
    nativeStyleToProp: { color: true },
  },
});

type IconProps = {
  icon: IconSvgElement;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
};

export function Icon({
  icon,
  size = 24,
  color = 'currentColor',
  strokeWidth = 1.5,
  className,
}: IconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
}
