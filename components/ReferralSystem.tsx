import { useState, useEffect } from 'react';
import { initUtils } from '@telegram-apps/sdk';
import { Modal, Placeholder, Button, Title } from '@telegram-apps/telegram-ui';
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader';
import { ModalClose } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalClose/ModalClose';

interface ReferralSystemProps {
  initData: string;
  userId: string;
  startParam: string;
}

const ReferralSystem: React.FC<ReferralSystemProps> = ({ initData, userId, startParam }) => {
  const [referrals, setReferrals] = useState<{ referredId: string, scorpionsEarned: number }[]>([]);
  const [referrer, setReferrer] = useState<string | null>(null);
  const [scorpionsEarned, setScorpionsEarned] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);
  const INVITE_URL = 'https://t.me/scorpion_world_bot/start';

  useEffect(() => {
    const checkReferral = async () => {
      if (startParam && userId) {
        try {
          const response = await fetch('/api/referrals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, referrerId: startParam }),
          });

          if (!response.ok) throw new Error('Failed to save referral');
          const data = await response.json();

          // Add scorpions earned to the user's balance
          setScorpionsEarned(data.scorpionsEarned);
        } catch (error) {
          console.error('Error saving referral:', error);
        }
      }
    };

    const fetchReferrals = async () => {
      try {
        const response = await fetch(`/api/referrals?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch referrals');
        const data = await response.json();
        setReferrals(data.referrals);
        setReferrer(data.referrer);
      } catch (error) {
        console.error('Error fetching referrals:', error);
      }
    };

    checkReferral();
    fetchReferrals();
  }, [userId, startParam]);

  const handleInviteFriend = () => {
    const utils = initUtils();
    const inviteLink = `${INVITE_URL}?startapp=${userId}`;
    const shareText = `Join me on this awesome Telegram mini app!`;
    const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
    utils.openTelegramLink(fullUrl);
  };

  const handleCopyLink = () => {
    const inviteLink = `${INVITE_URL}?startapp=${userId}`;
    navigator.clipboard.writeText(inviteLink);

    setModalOpen(true); // Open the modal
  };

  return (
    <div className="text-primaryLight p-6 rounded-lg shadow-custom max-w-md mx-auto">
      {referrer && (
        <p className="text-green-400 mb-4 text-center">You were referred by user {referrer}</p>
      )}

      <div className="text-center">
        <h2 className="text-2xl text-[#f48d2f] font-bold mb-2">👨‍👩‍👧‍👦 Invite Friends</h2>

        <p className="text-[#f48d2f] mb-6">
          Invite your friends and earn Scorpions.{' '}
          <a href="#" className="text-blue-400 underline">
            How it works?
          </a>
        </p>

        <div className="flex justify-center">
        <div className="text-center">
          <Title caps level="1" weight="1" className="text-5xl text-white">
          {scorpionsEarned}
          </Title>
          <p className="text-lg text-[#f48d2f]">Scorpion Earned</p>
        </div>
      </div>

        <div className="space-y-4 mt-4">
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

      <div className="flex item-center justify-between mt-6">
        <h2 className="text-lg text-[#f48d2f] font-bold mb-4">Your Friends</h2>
        <p className="text-lg text-[#f48d2f] font-bold mb-4">Total Referrals: <strong>{referrals.length}</strong></p>
      </div>

      {referrals.length > 0 && (
        <ul>
          {referrals.map((referral, index) => (
            <li key={index} className="bg-gray-800 p-2 mb-2 rounded">
              Referred User ID: {referral.referredId}, Scorpions Earned: {referral.scorpionsEarned}
            </li>
          ))}
        </ul>
      )}

      {/* Modal for notification */}
      <Modal
        header={
          <ModalHeader after={<ModalClose>Close</ModalClose>}>
            Notification
          </ModalHeader>
        }
        open={isModalOpen}
        onOpenChange={(open) => setModalOpen(open)}
      >
        <Placeholder
          description="Invite link copied to clipboard!"
          header="Success!"
        >
          <img
            alt="Telegram sticker"
            src="https://xelene.me/telegram.gif"
            style={{
              display: 'block',
              height: '144px',
              width: '144px',
              margin: '0 auto',
            }}
          />
        </Placeholder>
      </Modal>
    </div>
  );
};

export default ReferralSystem;
