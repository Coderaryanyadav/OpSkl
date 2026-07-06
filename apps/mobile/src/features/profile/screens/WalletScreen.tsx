import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../../core/store/useAuthStore';
import { useTheme } from '../../../core/hooks/useTheme';
import { supabase } from '../../../core/services/supabase';

interface Wallet {
  balance: number;
  held_balance: number;
  available_balance: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
  description: string;
}

export default function WalletScreen() {
  const { profile } = useAuthStore();
  const { colors, roundness } = useTheme();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amountInput, setAmountInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchWalletData();
    }
  }, [profile]);

  const fetchWalletData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // 1. Fetch Wallet Balance
      const { data: walletData, error: wError } = await supabase
        .from('wallets')
        .select('balance, held_balance, available_balance')
        .eq('user_id', profile.id)
        .single();

      if (wError) throw wError;
      setWallet(walletData);

      // 2. Fetch Transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .or(`from_user_id.eq.${profile.id},to_user_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (txError) throw txError;
      setTransactions(txData || []);
    } catch (e: any) {
      Alert.alert('Error loading wallet', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!profile || !amountInput) return;
    const depositAmt = parseFloat(amountInput);
    if (isNaN(depositAmt) || depositAmt <= 0) {
      Alert.alert('Error', 'Enter a valid positive amount to deposit');
      return;
    }

    setActionLoading(true);
    try {
      // Direct update simulating sandbox payment gateway capture callback
      const { error: rpcError } = await supabase.rpc('update_wallet_balance', {
        p_user_id: profile.id,
        p_amount: depositAmt,
        p_operation: 'add',
      });

      if (rpcError) throw rpcError;

      // Add to transaction log
      const { error: txError } = await supabase.from('transactions').insert({
        to_user_id: profile.id,
        amount: depositAmt,
        currency: 'INR',
        type: 'deposit',
        status: 'completed',
        payment_gateway: 'razorpay',
        description: 'Wallet Balance Deposit (Mock)',
      });

      if (txError) throw txError;

      Alert.alert('Deposit Complete', `Successfully deposited ₹${depositAmt} to wallet.`);
      setAmountInput('');
      fetchWalletData();
    } catch (e: any) {
      Alert.alert('Deposit Failed', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Wallet Card */}
      <View style={[styles.walletCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: roundness.lg }]}>
        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Available Balance</Text>
        <Text style={[styles.balanceText, { color: colors.text }]}>₹{wallet?.available_balance ?? '0.00'}</Text>
        
        <View style={styles.cardDetails}>
          <View>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Total Balance</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>₹{wallet?.balance ?? '0.00'}</Text>
          </View>
          <View>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>On Hold</Text>
            <Text style={[styles.detailValue, { color: colors.danger }]}>₹{wallet?.held_balance ?? '0.00'}</Text>
          </View>
        </View>
      </View>

      {/* Transaction Control */}
      <View style={[styles.actionSection, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: roundness.md }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Deposit Funds</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, borderRadius: roundness.sm }]}
            placeholder="Amount (INR)"
            placeholderTextColor={colors.textMuted}
            value={amountInput}
            onChangeText={setAmountInput}
            keyboardType="numeric"
          />
          <TouchableOpacity 
            style={[styles.depositBtn, { backgroundColor: colors.primary, borderRadius: roundness.sm }]} 
            onPress={handleDeposit}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.depositBtnText}>Deposit</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Transactions List */}
      <View style={styles.historySection}>
        <Text style={[styles.historyTitle, { color: colors.text }]}>Transaction History</Text>
        
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.txItem, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.txType, { color: colors.text }]}>{item.type.toUpperCase()}</Text>
                <Text style={[styles.txDate, { color: colors.textMuted }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.txAmount, { color: item.type === 'deposit' ? colors.success : colors.danger }]}>
                {item.type === 'deposit' ? '+' : '-'} ₹{item.amount}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No transactions logged yet.</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 48,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletCard: {
    padding: 24,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceText: {
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionSection: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  depositBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  depositBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  historySection: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  txType: {
    fontSize: 15,
    fontWeight: '600',
  },
  txDate: {
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 15,
  },
});
