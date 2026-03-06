'use client';

import { ChannelList, type ChannelListItem } from '@/components/chat/ChannelList';

export type ChatLayoutProps = {
  channels: ChannelListItem[];
  children: React.ReactNode;
};

export function ChatLayout({ channels, children }: ChatLayoutProps): React.ReactElement {
  return (
    <div className="flex h-[calc(100vh-56px)] min-h-0 w-full">
      <div className="hidden md:block">
        <ChannelList items={channels} />
      </div>
      <section className="flex min-w-0 flex-1 flex-col">{children}</section>
    </div>
  );
}
