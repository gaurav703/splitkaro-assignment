/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import SMSReader from './components/SMSReader';

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <SMSReader />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
});

export default App;
