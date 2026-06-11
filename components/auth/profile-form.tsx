'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ProfileForm() {
  const { user, updateProfile, updatePassword } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    const parts = user.name.split(' ');
    setFirstName(parts[0] ?? '');
    setLastName(parts.slice(1).join(' '));
  }, [user]);

  if (!user) {
    return null;
  }

  async function handleProfileSave(event: React.FormEvent) {
    event.preventDefault();
    setIsSavingProfile(true);
    const { error } = await updateProfile({
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
    });
    setIsSavingProfile(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Profile updated');
  }

  async function handlePasswordSave(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setIsSavingPassword(true);
    const { error } = await updatePassword(newPassword);
    setIsSavingPassword(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    setNewPassword('');
    toast.success('Password updated');
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleProfileSave} className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Profile</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <Button type="submit" disabled={isSavingProfile}>
          {isSavingProfile ? 'Saving…' : 'Save profile'}
        </Button>
      </form>

      <form onSubmit={handlePasswordSave} className="space-y-4 border-t pt-8">
        <div>
          <h2 className="text-lg font-medium">Password</h2>
          <p className="text-sm text-muted-foreground">Update your account password</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <Button type="submit" variant="outline" disabled={isSavingPassword || !newPassword}>
          {isSavingPassword ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </div>
  );
}
