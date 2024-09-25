import { useState, useEffect } from 'react';
import { initUtils } from '@telegram-apps/sdk';
import useAuth from '@/app/hooks/useAuth'; // Import the useAuth hook

const ReferralSystem: React.FC = () => {
  const [referrals, setReferrals] = useState<string[]>([]);
  const [referrer, setReferrer] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const INVITE_URL = 'https://t.me/scorpion_world_bot/start';

  // Use the useAuth hook to get the authenticated user and player data
  const { user, playerData, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && playerData) {
      // Calculate total referral count
      setReferralCount(referrals.length);
    }
  }, [referrals, playerData, isLoading]);

  useEffect(() => {
    const checkReferral = async () => {
      if (playerData?.id) {
        try {
          const response = await fetch('/api/referrals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: playerData.id, referrerId: user?.id }), // Using playerData.id and user.id
          });
          if (!response.ok) throw new Error('Failed to save referral');
        } catch (error) {
          console.error('Error saving referral:', error);
        }
      }
    };

    const fetchReferrals = async () => {
      if (playerData?.id) {
        try {
          const response = await fetch(`/api/referrals?userId=${playerData.id}`);
          if (!response.ok) throw new Error('Failed to fetch referrals');
          const data = await response.json();
          setReferrals(data.referrals);
          setReferrer(data.referrer);
        } catch (error) {
          console.error('Error fetching referrals:', error);
        }
      }
    };

    if (!isLoading && playerData?.id) {
      checkReferral();
      fetchReferrals();
    }
  }, [playerData, isLoading, user]);

  const handleInviteFriend = () => {
    const utils = initUtils();
    const inviteLink = `${INVITE_URL}?startapp=${playerData?.id}`;
    const shareText = `Join me on this awesome Telegram mini app!`;
    const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
    utils.openTelegramLink(fullUrl);
  };

  const handleCopyLink = () => {
    const inviteLink = `${INVITE_URL}?startapp=${playerData?.id}`;
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  if (isLoading) {
    return <div>Loading...</div>; // Show loading state until data is fetched
  }

  return (
    <div className="text-primaryLight p-6 rounded-lg shadow-custom max-w-md mx-auto">
      {referrer && (
        <p className="text-green-400 mb-4">You were referred by user {referrer}</p>
      )}

      <div className="text-center">
        <h2 className="text-3xl text-[#f48d2f] font-bold mb-2">👨‍👩‍👧‍👦 Invite Frens</h2>
        <p className="text-[#f48d2f] mb-6">
          Invite your friends and both of you will receive bonuses. Score 10% from buddies + 2.5% from their referrals
        </p>
      </div>

      <div className="flex item-center justify-between mt-6">
        <h2 className="text-lg text-[#f48d2f] font-bold mb-4">Your Frens</h2>
        <p className="text-lg text-[#f48d2f] font-bold mb-4">Total Referrals: <strong>{referralCount}</strong></p> 
      </div>

      {referrals.length > 0 && (
        <ul>
          {referrals.map((referral, index) => (
            <li key={index} className="bg-gray-800 p-2 mb-2 rounded">
              {referral}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-4">
        <button
          onClick={handleInviteFriend}
          className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded transition duration-300"
        >
          Invite Friend
        </button>
        <button
          onClick={handleCopyLink}
          className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded transition duration-300"
        >
          Copy Invite Link
        </button>
      </div>
    </div>
  );
};

export default ReferralSystem;
