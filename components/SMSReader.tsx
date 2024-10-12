/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {useEffect, useState} from 'react';
import {
  Button,
  FlatList,
  Text,
  View,
  PermissionsAndroid,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Pressable,
} from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';

interface Message {
  id: string;
  body: string;
  amount: string;
  date: string;
  timeAgo: string;
  type: 'debited' | 'credited';
  sender: string;
}

const SMSReader: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'credited' | 'debited'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null,
  );

  const requestSmsPermission = async (): Promise<boolean> => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'SMS Permission',
          message:
            'This app needs access to your SMS messages to display expenses',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const calculateTimeAgo = (dateSent: number) => {
    const now = new Date();
    const diffInMilliseconds = now.getTime() - dateSent;
    const diffInMinutes = Math.floor(diffInMilliseconds / 1000 / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const fetchSms = async () => {
    setLoading(true);
    const filter = {
      box: 'inbox',
      maxCount: 1000,
    };

    SmsAndroid.list(
      JSON.stringify(filter),
      (fail: any) => {
        console.log('Failed with this error: ' + fail);
        setLoading(false);
      },
      (count: any, smsList: any) => {
        const messagesArray: any[] = JSON.parse(smsList);
        const expenseMessages = messagesArray.filter(
          message =>
            message.body.includes('debited') ||
            message.body.includes('credited'),
        );

        const parsedMessages: Message[] = expenseMessages.map(
          (message: any) => {
            const amountMatch = message.body.match(/Rs\.?\s?(\d+(\.\d{1,2})?)/);
            const amount = amountMatch ? amountMatch[1] : 'Unknown';
            const isDebited = message.body.includes('debited');
            const timeAgo = calculateTimeAgo(message.date_sent);

            return {
              id: message._id,
              body: message.body,
              amount: amount,
              date: new Date(message.date_sent).toLocaleDateString(),
              timeAgo: timeAgo,
              type: isDebited ? 'debited' : 'credited',
              sender: message.address || 'Unknown',
            };
          },
        );
        setMessages(parsedMessages);
        setLoading(false);
      },
    );
  };

  useEffect(() => {
    const handleViewExpenses = async () => {
      console.log('Requesting SMS permission');
      const permissionGranted = await requestSmsPermission();
      setPermissionGranted(permissionGranted);

      if (permissionGranted) {
        fetchSms();
      } else {
        console.log('SMS permission denied');
      }
    };

    handleViewExpenses();
  }, []);

  let filteredMessages = messages.filter(message => {
    if (filter === 'all') return true;
    return message.type === filter;
  });

  filteredMessages = filteredMessages.filter(message => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      message.body.toLowerCase().includes(searchLower) ||
      message.sender.toLowerCase().includes(searchLower) ||
      message.amount.includes(searchLower);

    if (filter === 'all') return matchesSearch;
    return message.type === filter && matchesSearch;
  });

  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        width: '100%',
      }}>
      <View style={styles.boxWithShadow}>
        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginVertical: 20,
          }}>
          <Text style={styles.title}>Expenses</Text>
          <TextInput
            style={styles.search}
            placeholder="Search by name, number or UPI ID"
            value={searchQuery}
            onChangeText={text => setSearchQuery(text)}
          />
        </View>
        <View style={styles.filterContainer}>
          <Pressable
            style={
              filter === 'all' ? styles.active_button : styles.unactive_button
            }
            onPress={() => setFilter('all')}>
            <Text
              style={
                filter === 'all' ? styles.active_button : styles.unactive_button
              }>
              All
            </Text>
          </Pressable>

          <Pressable
            style={
              filter === 'credited'
                ? styles.active_button
                : styles.unactive_button
            }
            onPress={() => setFilter('credited')}>
            <Text
              style={
                filter === 'credited'
                  ? styles.active_button
                  : styles.unactive_button
              }>
              Credited
            </Text>
          </Pressable>

          <Pressable onPress={() => setFilter('debited')}>
            <Text
              style={
                filter === 'debited'
                  ? styles.active_button
                  : styles.unactive_button
              }>
              Debited
            </Text>
          </Pressable>
        </View>
      </View>

      <View
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1,
          width: '100%',
        }}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#6200EE"
            style={styles.loadingIndicator}
          />
        ) : permissionGranted === false ? (
          <View style={styles.noPermissionContainer}>
            <Text style={styles.noPermissionText}>
              SMS permission denied. Please enable it in settings.
            </Text>
            <Pressable
              style={styles.requestButton}
              onPress={requestSmsPermission}>
              <Text style={styles.requestButtonText}>Request Permission</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filteredMessages}
            keyExtractor={item => item.id}
            contentContainerStyle={{paddingHorizontal: 16, paddingVertical: 10}}
            renderItem={({item}) => (
              <View style={styles.expenseCard}>
                <View>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      textAlign: 'center',
                      lineHeight: 34,
                      color: '#fff',
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      backgroundColor: '#749AC6',
                      marginBottom: 10,
                    }}>
                    {item.sender[0]}
                  </Text>
                </View>
                <View>
                  <Text style={styles.senderText}>{item.sender}</Text>
                  <Text style={styles.descriptionText}>{item.body}</Text>
                </View>
                <View>
                  <Text style={styles.dateText}>{item.date}</Text>
                  <Text style={styles.amountText(item.type)}>
                    ₹{item.amount}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  boxWithShadow: {
    paddingHorizontal: 20,
    width: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderRadius: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  search: {
    width: 284,
    height: 39,
    borderWidth: 0.8,
    borderColor: '#BEBEBE',
    borderRadius: 12,
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    paddingLeft: 10,
  },
  loadingIndicator: {
    marginTop: 20,
  },
  unactive_button: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
    color: '#a3a3a3',
    width: 75,
    textAlign: 'center',
  },

  active_button: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
    color: '#000',
    borderWidth: 1,
    borderRadius: 4,
    borderColor: '#000',
    width: 75,
    textAlign: 'center',
  },

  filterContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 10,
    width: '100%',
  },
  expenseCard: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  amountText: (type: 'debited' | 'credited') => ({
    marginTop: 10,
    fontSize: 18,
    lineheight: 27,
    fontWeight: '500',
    color: type === 'debited' ? '#B40000' : '#11A311',
  }),
  senderText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#111111',
    fontWeight: 'bold',
    marginVertical: 5,
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#767676',
    fontWeight: '400',
    width: 150,
  },
  dateText: {
    fontSize: 10,
    lineHeight: 18,
    color: '#b4b4b4',
  },
  timeAgoText: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  noPermissionContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  noPermissionText: {
    fontSize: 16,
    color: '#6200EE',
    marginBottom: 10,
    textAlign: 'center',
    width: '70%',
  },
  requestButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200EE',
    textAlign: 'left',
    marginBottom: 10,
  },
});

export default SMSReader;
