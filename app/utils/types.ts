export type IconProps = {
    size?: number;
    className?: string;
}


export type UserData = {
    id: string;
    username: string;
    first_name: string;
    last_name?: string;
    photo_url?: string;
    fishBalance: number;
    tasksCompleted: Record<string, boolean>;
    joinDate: string;
    isNewPlayer: boolean;
    language_code?: string; // Assuming UserData requires this
  };
  
  export type PlayerProfile = UserData; // Alias to ensure consistency