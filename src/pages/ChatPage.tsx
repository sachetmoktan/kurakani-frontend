import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../context/auth/useAuth';
import fetchApi from '../lib/api/fetch';
import notify from '../lib/toast/toast';
import { socket } from '../socket/socket';
import type { TConversation, TUser } from '../types/auth.types';
import type { TApiResponse, TConversationUpdate, TMessage } from '../types/common.types';

function ChatPage() {
  const navigate = useNavigate();
  const { payload, removeToken } = useAuth();

  const [text, setText] = useState('');
  const [myConversations, setMyConversations] = useState<TConversation[]>([]);
  const [privateMsgs, setPrivateMsgs] = useState<TMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>('');
  const [allUsers, setAllUsers] = useState<TUser[]>([]);

  const [tobeUpdatedConvId, setToBeUpdatedConvId] = useState<string | null>(null);

  const selectRef = useRef<HTMLSelectElement>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [myConversations]);

  const handleConversationUpdate = (data: TConversationUpdate) => {
    console.log('AlertConversationUpdate', data);

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
      console.log('AlertConversationUpdate123456:->', { data, conversationId, updatedConversations });

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

  useEffect(() => {
    (async () => {
      try {
        const users = await fetchApi<TApiResponse<TUser[]>>('/users');
        setAllUsers(users.data);
      } catch (err) {
        notify.error(`${err}`);
      }
    })();
  }, []);

  useEffect(() => {
    if (payload && payload.userId) {
      (async () => {
        try {
          const conversations = await fetchApi<TApiResponse<TConversation[]>>(`/conversations/user/${payload.userId}`);
          setMyConversations(conversations.data);
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
    setConversationId(() => convoId);
  };

  useEffect(() => {
    const handleConversationCreated = ({ conversationId }: { conversationId: string }) => {
      console.log('Conversation created:', conversationId);

      // Now join the conversation
      socket.emit('conversation:join', {
        conversationId,
      });

      // console.log('ConversationId set success', conversationId);
      setConversationId(() => conversationId);
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
    console.log('Sending Message', conversationId, text);
    socket.emit('message:send', {
      conversationId,
      content: text,
    });

    setText('');
  };

  useEffect(() => {
    const handleNewMessages = (messageObj: TMessage) => {
      setPrivateMsgs(prev => [...prev, messageObj]);

      // Yesterday added this line, test it well
      socket.emit('message:seen', { conversationId: messageObj.conversationId });
      //-
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

  const handleSelectToStartConversation = async () => {
    if (selectRef.current && selectRef.current.value) {
      startNewPrivateConversation(selectRef.current.value);
      selectRef.current.value = '';
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

  const usersNotInConversation = () => {
    if (payload && allUsers && myConversations) {
      const usersInConversations = new Set(
        myConversations.flatMap(conversation => conversation.participants.map(participant => participant._id)),
      );
      usersInConversations.add(payload.userId);
      const usersNotInConversations = allUsers.filter(usr => !usersInConversations.has(usr._id));
      return usersNotInConversations;
    }
    return [];
  };

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
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
    const handleTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.conversationId !== conversationId) {
        return;
      }

      setIsOtherUserTyping(data.isTyping);
    };

    socket.on('conversation:typing', handleTyping);

    return () => {
      socket.off('conversation:typing', handleTyping);
    };
  }, [conversationId]);

  return (
    <>
      <nav className='bg-pink-100 h-14 flex justify-between items-center px-8 sticky top-0'>
        <h2>{payload && payload.name ? `Hi, ${payload?.name}` : ''}</h2>
        <button type='button' onClick={handleLogout} className='px-4 py-2 h-8 hover:cursor-pointer'>
          Logout
        </button>
      </nav>
      <main className='h-[calc(100dvh-56px)] flex justify-between'>
        <section className='flex justify-between gap-2 w-50'>
          <ul className='w-full pl-4  overflow-y-auto'>
            <select ref={selectRef} defaultValue={''} onChange={() => handleSelectToStartConversation()}>
              <option value='' disabled>
                Choose a user...
              </option>
              {usersNotInConversation().map(item => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
            {payload &&
              payload?.userId &&
              myConversations &&
              myConversations.map((conversation, index) => {
                const conversationWith = conversation.participants.filter(participant => participant._id !== payload?.userId);
                const usrName = conversationWith[0]?.name;
                const unreadCount = conversation?.unreadCount?.[`${payload?.userId}`];
                return (
                  <li
                    key={`${conversationWith[0]}-${index}`}
                    onClick={() => {
                      continueExitingPrivateConversation(conversation._id);
                    }}
                    className='list-none border-b border-b-black flex items-center justify-center hover:cursor-pointer hover:bg-pink-100'
                  >
                    <p>{usrName}</p>
                    <p>({unreadCount}) Unread Messages</p>
                  </li>
                );
              })}
          </ul>
          <div className='border-l-2 border-l-black'></div>
        </section>
        <section className='grow pl-8 overflow-y-auto relative'>
          {/* <h1>Messages</h1> */}
          <ul className='p-0 pr-8 pb-[10dvh] flex flex-col gap-2'>
            {privateMsgs.map((message, index) => {
              const alignment = message.senderId === payload?.userId ? 'self-end' : 'self-start';
              return (
                <li key={`${message._id}-${index}`} className={`list-none ${alignment} border rounded-sm p-2`}>
                  {message.content}
                </li>
              );
            })}
            {isOtherUserTyping && <div>Typing...</div>}
            <div ref={messagesEndRef} />
          </ul>
          {conversationId && (
            <div className='fixed flex justify-center items-center bottom-0 left-0 right-16 pb-4 w-full'>
              <input
                value={text}
                onChange={event => handleInputChange(event)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    sendMessage();
                  }
                }}
                className='h-8 w-1/2'
              />
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default ChatPage;
