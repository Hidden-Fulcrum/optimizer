import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PinLoginProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PinLogin({ open, onOpenChange }: PinLoginProps) {
  const [pin, setPin] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(pin);
    if (success) {
      toast.success('Welcome back!');
      onOpenChange(false);
      setPin('');
    } else {
      toast.error('Invalid PIN');
      setPin('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter PIN</DialogTitle>
          <DialogDescription>
            Enter your 4-digit PIN to access the Meal Prep Optimizer
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={pin.length !== 4}>
            Login
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
