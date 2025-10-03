import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserBalance } from '@/hooks/useUserBalance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Wallet, History } from 'lucide-react';

interface PaymentTransaction {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
}

export default function Payment() {
  const { user } = useAuth();
  const { balance } = useUserBalance();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['card', 'bank_transfer']);

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('payment_methods')
        .single();

      if (error) throw error;
      const methods = data?.payment_methods;
      setPaymentMethods(
        Array.isArray(methods) 
          ? methods.filter((method): method is string => typeof method === 'string')
          : ['card', 'bank_transfer']
      );
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handlePayment = async () => {
    if (!user || !amount || Number(amount) <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите корректную сумму для пополнения",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create transaction record
      const { data, error } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: user.id,
          amount: Number(amount),
          payment_method: paymentMethod,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate payment processing (in real app, integrate with payment gateway)
      setTimeout(async () => {
        try {
          // Update transaction status to completed
          await supabase
            .from('payment_transactions')
            .update({ status: 'completed' })
            .eq('id', data.id);

          // Update user balance
          const { error: balanceError } = await supabase
            .from('user_balance')
            .update({ balance: balance + Number(amount) })
            .eq('user_id', user.id);

          if (balanceError) throw balanceError;

          toast({
            title: "Успешно",
            description: `Баланс пополнен на ${amount}₽`,
          });

          setAmount('');
          fetchTransactions();
        } catch (error) {
          console.error('Error processing payment:', error);
          toast({
            title: "Ошибка",
            description: "Ошибка при обработке платежа",
            variant: "destructive",
          });
        }
        setLoading(false);
      }, 2000);

    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать платеж",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Завершен';
      case 'pending': return 'В обработке';
      case 'failed': return 'Неудачно';
      default: return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'card': return 'Банковская карта';
      case 'bank_transfer': return 'Банковский перевод';
      default: return method;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Пополнение баланса</h1>
        <p className="text-muted-foreground">Управление балансом и историей платежей</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Текущий баланс</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balance.toFixed(2)}₽</div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Пополнить баланс
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Сумма пополнения (₽)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="payment_method">Способ оплаты</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {getPaymentMethodText(method)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handlePayment} 
              disabled={loading || !amount || Number(amount) <= 0}
              className="w-full"
            >
              {loading ? 'Обработка...' : `Пополнить на ${amount || '0'}₽`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            История транзакций
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              История транзакций пуста
            </p>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">+{transaction.amount}₽</p>
                    <p className="text-sm text-muted-foreground">
                      {getPaymentMethodText(transaction.payment_method)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className={`font-medium ${getStatusColor(transaction.status)}`}>
                    {getStatusText(transaction.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}