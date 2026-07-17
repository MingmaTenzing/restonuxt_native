import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          md="dashboard"
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
        />
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="bookings">
        <NativeTabs.Trigger.Icon
          md="book_online"
          sf={{ default: 'calendar.badge.plus', selected: 'calendar.badge.plus' }}
        />
        <NativeTabs.Trigger.Label>Bookings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="orders">
        <NativeTabs.Trigger.Icon
          md="receipt_long"
          sf={{ default: 'list.bullet.rectangle', selected: 'list.bullet.rectangle.fill' }}
        />
        <NativeTabs.Trigger.Label>Orders</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="pos">
        <NativeTabs.Trigger.Icon
          md="point_of_sale"
          sf={{ default: 'menucard', selected: 'menucard.fill' }}
        />
        <NativeTabs.Trigger.Label>POS</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cashier">
        <NativeTabs.Trigger.Icon
          md="payments"
          sf={{ default: 'banknote', selected: 'banknote.fill' }}
        />
        <NativeTabs.Trigger.Label>Cashier</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="kitchen">
        <NativeTabs.Trigger.Icon
          md="soup_kitchen"
          sf={{ default: 'frying.pan', selected: 'frying.pan.fill' }}
        />
        <NativeTabs.Trigger.Label>Kitchen</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tables">
        <NativeTabs.Trigger.Icon
          md="table_restaurant"
          sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }}
        />
        <NativeTabs.Trigger.Label>Tables</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sessions">
        <NativeTabs.Trigger.Icon md="schedule" sf={{ default: 'clock', selected: 'clock.fill' }} />
        <NativeTabs.Trigger.Label>Sessions</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="menu">
        <NativeTabs.Trigger.Icon
          md="restaurant_menu"
          sf={{ default: 'fork.knife', selected: 'fork.knife' }}
        />
        <NativeTabs.Trigger.Label>Menu</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stock">
        <NativeTabs.Trigger.Icon
          md="inventory_2"
          sf={{ default: 'shippingbox', selected: 'shippingbox.fill' }}
        />
        <NativeTabs.Trigger.Label>Stock</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="staff">
        <NativeTabs.Trigger.Icon
          md="people"
          sf={{ default: 'person.2', selected: 'person.2.fill' }}
        />
        <NativeTabs.Trigger.Label>Staff</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="roster">
        <NativeTabs.Trigger.Icon
          md="event_note"
          sf={{ default: 'calendar', selected: 'calendar' }}
        />
        <NativeTabs.Trigger.Label>Roster</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agent">
        <NativeTabs.Trigger.Icon
          md="auto_awesome"
          sf={{ default: 'sparkles', selected: 'sparkles' }}
        />
        <NativeTabs.Trigger.Label>Resto Agent</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon
          md="settings"
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
        />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
