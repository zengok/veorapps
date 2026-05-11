import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

export type AppIconName =
  | 'add'
  | 'back'
  | 'bell'
  | 'calendar'
  | 'calendar-grid'
  | 'calendar-month'
  | 'check'
  | 'close'
  | 'currency'
  | 'dashboard'
  | 'delete'
  | 'diffuser'
  | 'drop'
  | 'edit'
  | 'filter'
  | 'flower'
  | 'home'
  | 'logout'
  | 'minus'
  | 'no-package'
  | 'orders'
  | 'package'
  | 'perfume'
  | 'plus'
  | 'sale'
  | 'search'
  | 'settings'
  | 'stock'
  | 'store'
  | 'trend'
  | 'upload'
  | 'user'
  | 'warning'
  | 'warning-hex';

const ICONS: Record<AppIconName, number> = {
  add: require('../../assets/ui-icons/add.png'),
  back: require('../../assets/ui-icons/back.png'),
  bell: require('../../assets/ui-icons/bell.png'),
  calendar: require('../../assets/ui-icons/calendar.png'),
  'calendar-grid': require('../../assets/ui-icons/calendar-grid.png'),
  'calendar-month': require('../../assets/ui-icons/calendar-month.png'),
  check: require('../../assets/ui-icons/check.png'),
  close: require('../../assets/ui-icons/close.png'),
  currency: require('../../assets/ui-icons/currency.png'),
  dashboard: require('../../assets/ui-icons/dashboard.png'),
  delete: require('../../assets/ui-icons/delete.png'),
  diffuser: require('../../assets/ui-icons/diffuser.png'),
  drop: require('../../assets/ui-icons/drop.png'),
  edit: require('../../assets/ui-icons/edit.png'),
  filter: require('../../assets/ui-icons/filter.png'),
  flower: require('../../assets/ui-icons/flower.png'),
  home: require('../../assets/ui-icons/home.png'),
  logout: require('../../assets/ui-icons/logout.png'),
  minus: require('../../assets/ui-icons/minus.png'),
  'no-package': require('../../assets/ui-icons/no-package.png'),
  orders: require('../../assets/ui-icons/orders.png'),
  package: require('../../assets/ui-icons/package.png'),
  perfume: require('../../assets/ui-icons/perfume.png'),
  plus: require('../../assets/ui-icons/plus.png'),
  sale: require('../../assets/ui-icons/sale.png'),
  search: require('../../assets/ui-icons/search.png'),
  settings: require('../../assets/ui-icons/settings.png'),
  stock: require('../../assets/ui-icons/stock.png'),
  store: require('../../assets/ui-icons/store.png'),
  trend: require('../../assets/ui-icons/trend.png'),
  upload: require('../../assets/ui-icons/upload.png'),
  user: require('../../assets/ui-icons/user.png'),
  warning: require('../../assets/ui-icons/warning.png'),
  'warning-hex': require('../../assets/ui-icons/warning-hex.png'),
};

interface Props {
  name: AppIconName;
  size?: number;
  opacity?: number;
  style?: StyleProp<ImageStyle>;
}

export default function AppIcon({ name, size = 24, opacity = 1, style }: Props) {
  return (
    <Image
      source={ICONS[name]}
      style={[{ width: size, height: size, opacity }, style]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
