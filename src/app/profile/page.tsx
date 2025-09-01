import { ProfileClient } from '@/components/profile/profile-client';

export default function ProfilePage() {
  const userData = {
    fullName: 'rohit chigatapu',
    email: 'rohitchigatapu@example.com',
    avatarUrl: 'https://picsum.photos/100',
    memberSince: 'Jan 2024',
    reportsAnalyzed: 0,
    questionsAsked: 0,
    aiPreferences: {
      language: 'en',
      tone: 'professional',
    },
  };

  return <ProfileClient user={userData} />;
}
