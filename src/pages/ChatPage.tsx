import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSearchInput } from '../components/UserSearchInput';
import useAuth from '../context/auth/useAuth';
import fetchApi from '../lib/api/fetch';
import notify from '../lib/toast/toast';
import { socket } from '../socket/socket';
import type { TConversation, TUser } from '../types/auth.types';
import type { TApiResponse, TConversationUpdate, TMessage } from '../types/common.types';
import { dateTimeFormatter } from '../utils/common-function';

function ChatPage() {
  const navigate = useNavigate();
  const { payload, removeToken } = useAuth();

  const [text, setText] = useState('');
  const [myConversations, setMyConversations] = useState<TConversation[]>([]);
  const [privateMsgs, setPrivateMsgs] = useState<TMessage[]>([]);
  const [conversationId, setActiveConversationId] = useState<string>('');

  const [tobeUpdatedConvId, setToBeUpdatedConvId] = useState<string | null>(null);

  const [seenStatus, setSeenStatus] = useState(false);

  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [myConversations]);

  useEffect(() => {
    (function () {
      setSeenStatus(() => false);
    })();
  }, [conversationId]);

  const handleConversationUpdate = (data: TConversationUpdate) => {
    // console.log('AlertConversationUpdate', data);

    if ('conversation' in data) {
      console.log('New Conversation added in array: ', data.conversation);
      setMyConversations(prevConversations => [data.conversation, ...prevConversations]);
    } else {
      setToBeUpdatedConvId(() => data.conversationId); // for updating unread count if the current conversation is open

      setMyConversations(prevConversations => {
        const updatedConversations = prevConversations.map(conversation => {
          if (conversation._id !== data.conversationId) {
            return conversation;
          }

          return {
            ...conversation,
            unreadCount: {
              ...conversation.unreadCount,
              [data.unreadCount.userId]: data.unreadCount.count,
            },
          };
        });

        return updatedConversations;
      });
    }
  };
  useEffect(() => {
    socket.emit('private:join');

    socket.on('conversation:update', handleConversationUpdate);
    return () => {
      socket.off('conversation:update', handleConversationUpdate);
    };
  }, []);

  const handleConversationIsOpen = (data: { convId: string; usrId: string }) => {
    setMyConversations(prevConversations => {
      const updatedConversations = prevConversations.map(conversation => {
        if (conversation._id !== data.convId) {
          return conversation;
        }

        return {
          ...conversation,
          unreadCount: {
            ...conversation.unreadCount,
            [data.usrId]: 0,
          },
        };
      });

      return updatedConversations;
    });
  };
  // only to update the unread message to zero if the current conversation is open
  useEffect(() => {
    socket.on('currentconversation:active', handleConversationIsOpen);
    return () => {
      socket.off('currentconversation:active', handleConversationIsOpen);
    };
  }, []);

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const users = await fetchApi<TApiResponse<TUser[]>>('/users');
  //       console.log('AllUsers', users.data);
  //     } catch (err) {
  //       notify.error(`${err}`);
  //     }
  //   })();
  // }, []);

  useEffect(() => {
    if (payload && payload.userId) {
      (async () => {
        try {
          const conversations = await fetchApi<TApiResponse<TConversation[]>>(`/conversations/user/${payload.userId}`);
          setMyConversations(() => conversations.data);
        } catch (err) {
          notify.error(`${err}`);
        }
      })();
    }
  }, [payload, payload?.userId]);

  const startNewPrivateConversation = (otherUserId: string) => {
    socket.emit('conversation:create', {
      otherUserId,
    });
  };

  const continueExitingPrivateConversation = (convoId: string) => {
    socket.emit('conversation:join', {
      conversationId: convoId,
    });
    setActiveConversationId(() => convoId);
  };

  useEffect(() => {
    const handleConversationCreated = ({ conversationId }: { conversationId: string }) => {
      // console.log('Conversation created:', conversationId);

      // Now join the conversation
      socket.emit('conversation:join', {
        conversationId,
      });

      setActiveConversationId(() => conversationId);
    };

    socket.on('conversation:created', handleConversationCreated);

    return () => {
      socket.off('conversation:created', handleConversationCreated);
    };
  }, []);

  // Need to make api to load old messages from conversationId
  useEffect(() => {
    if (!conversationId) {
      return;
    }

    (async () => {
      setPrivateMsgs(() => []);
      try {
        const oldMessages = await fetchApi<TApiResponse<TMessage[]>>(`/conversations/${conversationId}/messages`);
        setPrivateMsgs(prev => [...prev, ...oldMessages.data]);
      } catch (err) {
        notify.error(`${err}`);
      }
    })();
  }, [conversationId]);

  const sendMessage = () => {
    if (!conversationId) return;

    if (!text.trim()) {
      return;
    }
    // Set isTyping flag to false
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTypingRef.current) {
      isTypingRef.current = false;

      socket.emit('message:typing', {
        conversationId,
        typingUserId: payload?.userId,
        isTyping: false,
      });
    }
    //--
    setSeenStatus(() => false); // set it false to remove seen status when a new message is sent

    // console.log('Sending Message', conversationId, text);
    socket.emit('message:send', {
      conversationId,
      content: text,
    });

    setText('');
  };

  useEffect(() => {
    const handleNewMessages = (messageObj: TMessage) => {
      setPrivateMsgs(prev => [...prev, messageObj]);
      setSeenStatus(() => false); // set it false to remove seen status when a new message is sent
    };

    socket.on('message:new', handleNewMessages);

    return () => {
      socket.off('message:new', handleNewMessages);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // const logoutData = await fetchApi<TApiResponse<TUser>>('/logout', {
      //   method: 'POST',
      // });
      // notify.success(logoutData.message);
      removeToken();
      notify.success('Logout Successfully');
      navigate('/login');
    } catch (err) {
      notify.error(`${err}`);
    }
  };

  useEffect(() => {
    (function () {
      if (conversationId && tobeUpdatedConvId && conversationId.toString() === tobeUpdatedConvId.toString()) {
        socket.emit('private:currentconversation', {
          conversationId,
        });
        setToBeUpdatedConvId(null);
      }
    })();
  }, [conversationId, tobeUpdatedConvId]);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState<string | null>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setText(value);

    if (!conversationId) {
      return;
    }

    if (value.length === 0) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isTypingRef.current) {
        isTypingRef.current = false;

        socket.emit('message:typing', {
          conversationId,
          typingUserId: payload?.userId,
          isTyping: false,
        });
      }

      return;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;

      socket.emit('message:typing', {
        conversationId,
        typingUserId: payload?.userId,
        isTyping: true,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;

      socket.emit('message:typing', {
        conversationId,
        typingUserId: payload?.userId,
        isTyping: false,
      });
    }, 1000);
  };
  useEffect(() => {
    const handleTyping = (data: { conversationId: string; userId: string; isTyping: boolean; typingUserName: string }) => {
      if (data.conversationId !== conversationId) {
        return;
      }
      setIsOtherUserTyping(data.isTyping);
      setTypingUserName(data.typingUserName);
    };

    socket.on('conversation:typing', handleTyping);

    return () => {
      socket.off('conversation:typing', handleTyping);
    };
  }, [conversationId]);

  // logic to show seen status
  useEffect(() => {
    const handleConvSeen = (data: { conversationId: string; lastSenderId: string; isReadByAll: boolean }) => {
      if (data.conversationId !== conversationId && payload?.userId.toString() !== data.lastSenderId.toString()) {
        return;
      }
      // console.log('Read by all status:', data);
      setSeenStatus(() => data.isReadByAll);
    };

    socket.on('conversation:seen', handleConvSeen);

    return () => {
      socket.off('conversation:seen', handleConvSeen);
    };
  }, [payload?.userId, conversationId]);

  const handleMessageClick = (event: React.MouseEvent<HTMLLIElement>) => {
    const id = event.currentTarget.dataset.id;
    if (!id) return;
    setSelectedMsgId(prev => (prev === id ? null : id));
  };

  const handleSelectUserForConversation = (usr: TUser) => {
    console.log({ usr });
    startNewPrivateConversation(usr._id);
  };

  return (
    <>
      <nav className='bg-pink-100 h-14 flex justify-between items-center px-8 sticky top-0 max-w-[1200px] mx-auto'>
        <h2 className='text-[clamp(1rem,4vw,1.5rem)] capitalize'>{payload && payload.name ? `Hi, ${payload?.name}` : ''}</h2>
        <button type='button' onClick={handleLogout} className='px-4 py-2 h-8 hover:cursor-pointer'>
          Logout
        </button>
      </nav>

      <section className='sticky top-14 max-w-[1200px] mx-auto flex justify-center items-center gap-2 bg-pink-100 z-2'>
        <UserSearchInput onSelect={handleSelectUserForConversation} />
      </section>

      <main className='h-[calc(100dvh-56px-34px)] flex justify-between w-full max-w-[1200px] mx-auto'>
        <section className='flex shrink-0 justify-between gap-2 w-[35%] min-w-[35%] max-w-5'>
          <ul className='w-full pl-4  overflow-y-auto overflow-x-hidden'>
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
        <section className='grow overflow-y-auto relative'>
          <div className='fixed top-14 w-full bg-red-100'></div>
          <ul className='p-0 px-2 pb-[10dvh] flex flex-col gap-2 sm:gap-3 md:gap-4 lg:gap-6"'>
            {privateMsgs.map((message, index) => {
              const alignment = message.senderId === payload?.userId ? 'self-end' : 'self-start';
              return (
                <li
                  key={`${message._id}-${index}`}
                  data-id={message._id}
                  className={`list-none ${alignment} border rounded-sm p-2 hover:cursor-pointer hover:outline outline-blue-300 flex flex-col gap-1`}
                  onClick={handleMessageClick}
                >
                  <span className='text-[clamp(0.6rem,4vw,1rem)]'>{message.content}</span>
                  {selectedMsgId && selectedMsgId === message._id && (
                    <span className='text-gray-400 text-[clamp(0.4rem,4vw,0.7rem)]'>{dateTimeFormatter(message.createdAt)}</span>
                  )}
                </li>
              );
            })}
            {privateMsgs.length < 1 && seenStatus && <span className='text-xs text-end text-gray-500'>No messages yet</span>}
            {privateMsgs.length > 0 && seenStatus && <span className='text-xs text-end text-gray-500'>Seen</span>}
            <div ref={messagesEndRef} />
          </ul>
          {conversationId && (
            <>
              <div className='fixed bottom-[25px] left-0 right-0 mx-auto flex w-[60%] max-w-[500px] items-end gap-2 rounded-xl border border-white/20 bg-white/30 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl'>
                <div className='flex min-w-0 flex-1 flex-col'>
                  <div className='h-5 text-sm text-gray-500'>
                    {isOtherUserTyping && `${typingUserName && typingUserName + ' is '}Typing...`}
                  </div>

                  <input
                    value={text}
                    onChange={handleInputChange}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        sendMessage();
                      }
                    }}
                    className='h-8 w-full bg-transparent px-2 outline-none placeholder:text-gray-500'
                  />
                </div>

                <button
                  type='button'
                  onClick={sendMessage}
                  disabled={!text}
                  className='h-8 shrink-0 rounded-sm border-0 bg-blue-500 px-3 text-white hover:cursor-pointer hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-400'
                >
                  Send
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}

export default ChatPage;
