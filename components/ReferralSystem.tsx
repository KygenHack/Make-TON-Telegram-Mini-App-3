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

  // Fetch referrals only once when the component is mounted or playerData is updated
  useEffect(() => {
    const fetchReferrals = async () => {
      if (playerData?.id) {
        try {
          const response = await fetch(`/api/referrals?userId=${playerData.id}`);
          if (!response.ok) throw new Error('Failed to fetch referrals');
          const data = await response.json();

          // Avoid duplicate referrals
          setReferrals(data.referrals);
          setReferrer(data.referrer);

          // Set referral count based on unique referrals only
          setReferralCount(new Set(data.referrals).size);
        } catch (error) {
          console.error('Error fetching referrals:', error);
        }
      }
    };

    if (!isLoading && playerData?.id) {
      fetchReferrals();
    }
  }, [playerData, isLoading]);

  const handleInviteFriend = () => {
    const utils = initUtils();
    const inviteLink = `${INVITE_URL}?startapp=${playerData?.id}`;
    const shareText = `Join me on this awesome Telegram mini app!`;
    const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;

    // Ensure utils is initialized correctly
    if (utils) {
      utils.openTelegramLink(fullUrl);
    } else {
      console.error('Telegram utils not initialized properly');
    }
  };

  const handleCopyLink = () => {
    const inviteLink = `${INVITE_URL}?startapp=${playerData?.id}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      alert('Invite link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy link: ', err);
    });
  };

  if (isLoading) {
    return <div className='text-center'>Please Wait</div>; // Show loading state until data is fetched
  }

  return (
    <div className="text-primaryLight p-6 rounded-lg shadow-custom max-w-md mx-auto">
      {referrer && (
        <p className="text-green-400 text-center mb-4">You were referred by {referrer}</p>
      )}

      <div className="text-center">
        <h2 className="text-3xl text-[#f48d2f] font-bold mb-2">👨‍👩‍👧‍👦 Invite Frens</h2>
        
        <p className="text-[#f48d2f] mb-6">
          Invite your friends and both of you will receive bonuses. Score 10% from buddies + 2.5% from their referrals.
        </p>
      </div>

      <div className="flex items-center justify-between mt-6">
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
          className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full transition duration-300"
        >
          Invite Friend
        </button>
        <button
          onClick={handleCopyLink}
          className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition duration-300"
        >
          Copy Invite Link
        </button>
      </div>
    </div>
  );
};

export default ReferralSystem;
