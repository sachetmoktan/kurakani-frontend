import useAuth from '../../context/auth/useAuth';
import type { TConversation } from '../../types/auth.types';

interface ISidebar {
  myConversations: TConversation[];
  conversationId: string;
  continueExitingPrivateConversation: (convoId: string) => void;
}

function Sidebar({ myConversations, conversationId, continueExitingPrivateConversation }: ISidebar) {
  const { payload } = useAuth();

  return (
    <>
      {/* <section className='flex shrink-0 justify-between gap-2 w-[35%] min-w-[35%] max-w-5'> */}
      <section className='flex shrink-0 justify-between gap-2 w-full h-full'>
        <ul className='w-full pl-4  overflow-y-auto overflow-x-hidden mt-14 sm:mt-16'>
          {payload &&
            payload?.userId &&
            myConversations &&
            myConversations.map((conversation, index) => {
              const conversationWith = conversation.participants.filter(participant => participant._id !== payload?.userId);
              const usrName = conversationWith[0]?.name;
              const unreadCount = conversation?.unreadCount?.[`${payload?.userId}`];
              const activeConversation = conversationId === conversation._id;
              return (
                <li
                  key={`${conversationWith[0]}-${index}`}
                  onClick={() => {
                    continueExitingPrivateConversation(conversation._id);
                  }}
                  className={`list-none border-b border-b-black flex flex-col items-center justify-center hover:cursor-pointer ${activeConversation ? 'bg-pink-200' : 'hover:bg-pink-50'}`}
                >
                  <p className='text-[clamp(0.6rem,4vw,1rem)] m-0 py-2 truncate capitalize'>{usrName}</p>
                  {!!unreadCount && <p className='text-[clamp(0.4rem,4vw,0.7rem)] m-0 text-red-700 pb-2'>({unreadCount}) Unread</p>}
                </li>
              );
            })}
        </ul>
        <div className='border-l-2 border-l-black'></div>
      </section>
    </>
  );
}

export default Sidebar;
