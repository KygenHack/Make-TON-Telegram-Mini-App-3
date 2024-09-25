import { useState, useEffect } from 'react';
import { initUtils } from '@telegram-apps/sdk';
import { claimReferralBonus, getReferrals, getReferrer, saveReferral } from '@/lib/storage'; // Supabase functions

interface ReferralSystemProps {
  initData: string;
  userId: string;
  startParam: string;
}

const ReferralSystem: React.FC<ReferralSystemProps> = ({ initData, userId, startParam }) => {
  const [playerData, setPlayerData] = useState<any>(null);
  const [referrals, setReferrals] = useState<string[]>([]);
  const [referrer, setReferrer] = useState<string | null>(null);
  const INVITE_URL = 'https://t.me/scorpion_world_bot/start';

  // Fetch player data and initialize if not found
  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        // Check if this user was referred by someone (startParam)
        if (startParam) {
          await saveReferral(userId, startParam); // Save the referral relationship in Supabase
        }

        // Fetch referral data (who referred the user and whom they referred)
        const [fetchedReferrals, fetchedReferrer] = await Promise.all([
          getReferrals(userId),  // Get users this player has referred
          getReferrer(userId),   // Get the referrer of this player
        ]);

        setReferrals(fetchedReferrals);
        setReferrer(fetchedReferrer);
      } catch (error) {
        console.error('Error fetching referral data:', error);
      }
    };

    fetchPlayerData();
  }, [userId, startParam]);

  // Function to claim the referral bonus
  const handleClaimBonus = async () => {
    try {
      // Claim the referral bonus
      await claimReferralBonus(userId);
      alert('Referral bonus claimed successfully!');
    } catch (error) {
      console.error('Error claiming referral bonus:', error);
      alert('Failed to claim the referral bonus.');
    }
  };

  // Function to invite friends using Telegram share
  const handleInviteFriend = () => {
    const utils = initUtils();
    const inviteLink = `${INVITE_URL}?startapp=${userId}`;
    const shareText = `Join me on this awesome Telegram mini app and catch scorpions!`;
    const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
    utils.openTelegramLink(fullUrl);
  };

  // Function to copy the invite link
  const handleCopyLink = () => {
    const inviteLink = `${INVITE_URL}?startapp=${userId}`;
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  return (
    <div className="text-primaryLight p-6 rounded-lg shadow-custom max-w-md mx-auto">
      {/* Display referrer information if available */}
      {referrer && (
        <p className="text-green-400 mb-4">You were referred by user {referrer}</p>
      )}

      {/* Referral Section */}
      <div className="text-center">
        <h2 className="text-3xl text-[#f48d2f] font-bold mb-2">👨‍👩‍👧‍👦 Invite Frens</h2>
        <p className="text-[#f48d2f] mb-6">
          Invite your friends and both of you will receive bonuses. Score 10% from buddies + 2.5% from their referrals.
        </p>
      </div>

      {/* Claim Referral Bonus */}
      <div className="text-center mb-4">
        <h3 className="text-lg text-[#f48d2f] font-bold">Claim your referral bonus</h3>
        <button
          onClick={handleClaimBonus}
          className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded transition duration-300"
        >
          Claim Bonus
        </button>
      </div>

      {/* Display list of referrals */}
      {referrals.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg text-[#f48d2f] font-bold mb-4">Your Referrals:</h3>
          <ul>
            {referrals.map((referral, index) => (
              <li key={index} className="bg-gray-800 p-2 mb-2 rounded">
                Player ID: {referral}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Invite Friend Section */}
      <div className="space-y-4 mt-6">
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
