import React from 'react';
import { Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import LeaveRequestsScreen from '../screens/LeaveRequestsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconText = '';
          
          if (route.name === 'Dashboard') {
            iconText = <Entypo name="home" size={24} color="black" />;
          } else if (route.name === 'Schedule') {
            iconText = <FontAwesome6 name="calendar-days" size={24} color="black" />;
          } else if (route.name === 'Profile') {
            iconText = <Ionicons name="person-sharp" size={24} color="black" />;
          } else if (route.name === 'Attendance') {
            iconText = <Ionicons name="people-sharp" size={24} color="black" />;
          } else if (route.name === 'LeaveRequests') {
            iconText = <FontAwesome name="file-text" size={24} color="black" />;
          } else if (route.name === 'Notifications') {
            iconText = <Ionicons name="notifications" size={24} color="black" />;
          }
          
          return <Text style={{ fontSize: size, color }}>{iconText}</Text>;
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Башкы' }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        options={{ title: 'Расписание' }}
      />
      
      {user?.role === 'TEACHER' && (
        <Tab.Screen 
          name="Attendance" 
          component={AttendanceScreen}
          options={{ title: 'Жоктоо' }}
        />
      )}
      
      {(user?.role === 'STUDENT' || user?.role === 'PARENT') && (
        <Tab.Screen 
          name="LeaveRequests" 
          component={LeaveRequestsScreen}
          options={{ title: 'Арыздар' }}
        />
      )}
      
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ title: 'Билдирүүлөр' }}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Профиль' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // TODO: Add loading screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
