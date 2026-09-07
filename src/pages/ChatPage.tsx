import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Dropdown from '../components/common/Dropdown';
import { ChevronLeft, ChevronRight, ThreeDots, TrashIcon } from '../components/common/Icons';
import { UserSearchInput } from '../components/common/UserSearchInput';
import Sidebar from '../components/layout/Sidebar';
import useAuth from '../context/auth/useAuth';
import fetchApi from '../lib/api/fetch';
import notify from '../lib/toast/toast';
import { socket } from '../socket/socket';
import type { TConversation, TUser } from '../types/auth.types';
import type { TApiResponse, TConversationUpdate, TMessage } from '../types/common.types';
import { dateTimeFormatter } from '../utils/common-function';
import ConfirmDialog from '../components/common/DialogModal';

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

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  function scrolltoLastMessage() {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }
  useEffect(() => {
    scrolltoLastMessage();
  }, [myConversations, privateMsgs]);

  useEffect(() => {
    (function () {
      setSeenStatus(() => false);
      resetSelectedMsgForMultiDel();
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
  async function fetchMessagesByConversationId() {
    setPrivateMsgs(() => []);
    try {
      const oldMessages = await fetchApi<TApiResponse<TMessage[]>>(`/conversations/${conversationId}/messages`);
      setPrivateMsgs(prev => [...prev, ...oldMessages.data]);
    } catch (err) {
      notify.error(`${err}`);
    }
  }
  useEffect(() => {
    if (!conversationId) {
      return;
    }

    (async () => {
      fetchMessagesByConversationId();
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

  // handle for actions
  const [actionDetail, setActionDetail] = useState<{ label: string; value: string } | null>(null);
  const handleActionClick = (action: { value: string; label: string }) => {
    setActionDetail(() => action);
    if (action.value === 'delete-all-messages') {
      setShowDeleteDialog(true);
    }
  };

  const showCheckboxesForMultiDelete = actionDetail?.value === 'delete-selected-messages';
  const [selectedMsgForMultiDel, setSelectedMsgForMultiDel] = useState<Array<string>>([]);

  function resetSelectedMsgForMultiDel() {
    setSelectedMsgForMultiDel(() => []);
    setActionDetail(null);
  }

  const deleteSelectedMessagesFromConversation = async () => {
    if (selectedMsgForMultiDel?.length < 1) return;
    try {
      const response = await fetchApi<TApiResponse<{ deletedCount: number }>>(`/messages/${conversationId}`, {
        method: 'DELETE',
        body: {
          messageIds: selectedMsgForMultiDel,
        },
      });
      console.log('AllUsersDeleted', response.data);
      resetSelectedMsgForMultiDel();
      fetchMessagesByConversationId();
    } catch (err) {
      notify.error(`${err}`);
    }
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const messageIdsByUser = privateMsgs.filter(msg => msg.senderId === payload?.userId).map(msg => msg._id);
      const response = await fetchApi<TApiResponse<{ deletedCount: number }>>(`/messages/${conversationId}`, {
        method: 'DELETE',
        body: {
          messageIds: messageIdsByUser,
        },
      });
      console.log('AllUsersDeleted', response.data);
      resetSelectedMsgForMultiDel();
      fetchMessagesByConversationId();
      setShowDeleteDialog(false);
    } catch (err) {
      notify.error(`${err}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <ConfirmDialog
        open={showDeleteDialog}
        title='Delete Messages?'
        description='Are you sure you want to delete the messages? This action cannot be undone.'
        confirmText='Delete'
        cancelText='Cancel'
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          resetSelectedMsgForMultiDel();
        }}
      />
      <nav className='bg-pink-100 h-14 flex justify-between items-center px-8 sticky top-0 max-w-[1200px] mx-auto'>
        <h2 className='text-[clamp(1rem,4vw,1.5rem)] capitalize'>{payload && payload.name ? `Hi, ${payload?.name}` : ''}</h2>
        <Button type='button' onClick={handleLogout}>
          Logout
        </Button>
      </nav>

      <section className='sticky top-14 max-w-[1200px] mx-auto flex justify-center items-center gap-2 bg-pink-100 z-2 pb-2'>
        <UserSearchInput onSelect={handleSelectUserForConversation} />
      </section>

      <main className='relative h-[calc(100dvh-98px)] flex justify-between w-full max-w-[1200px] mx-auto overflow-hidden overflow-x-hidden'>
        {/* <aside className='flex shrink-0 justify-between gap-2 w-[35%] min-w-[35%] sm:min-w-[25%] max-w-4 relative'> */}
        <aside
          className={`relative shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${sidebarOpen ? 'w-[35%] sm:w-[25%]' : 'w-0'}`}
        >
          <Sidebar
            myConversations={myConversations}
            conversationId={conversationId}
            continueExitingPrivateConversation={continueExitingPrivateConversation}
          />
          <ChevronLeft onClick={() => setSidebarOpen(() => false)} className='absolute right-0 top-4 z-20 -translate-y-1/2' />
        </aside>
        <ChevronRight
          onClick={() => setSidebarOpen(prev => !prev)}
          className={`absolute left-0 top-4 z-2 -translate-y-1/2 transition-all duration-300 ease-in-out ${sidebarOpen ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}
        />

        <section className='grow overflow-y-auto relative'>
          {conversationId && (
            <div className='sticky top-0 w-full bg-white flex justify-between items-center gap-4 p-2 md:px-4'>
              <span></span>
              {showCheckboxesForMultiDelete && (
                <div>
                  <Button
                    type='button'
                    variant='danger'
                    onClick={deleteSelectedMessagesFromConversation}
                    disabled={selectedMsgForMultiDel.length < 1}
                    className='mr-2'
                  >
                    Delete Selected
                  </Button>
                  <Button type='button' variant='transparent' onClick={resetSelectedMsgForMultiDel}>
                    Cancel
                  </Button>
                </div>
              )}
              {!showCheckboxesForMultiDelete && (
                <Dropdown
                  icon={<ThreeDots />}
                  options={[
                    {
                      label: 'Multiple Select',
                      value: 'delete-selected-messages',
                      icon: <TrashIcon />,
                    },
                    {
                      label: 'Delete All Sent By Me',
                      value: 'delete-all-messages',
                      icon: <TrashIcon />,
                    },
                  ]}
                  onChange={handleActionClick}
                />
              )}
            </div>
          )}
          <ul className='p-2 md:px-4 pb-[12dvh] flex flex-col gap-2 sm:gap-3 md:gap-4 lg:gap-6"'>
            {privateMsgs.map((message, index) => {
              const alignment = message.senderId === payload?.userId ? 'self-end' : 'self-start';
              return (
                <li
                  key={`${message._id}-${index}`}
                  // data-id={message._id}
                  className={`list-none ${alignment} flex gap-1 ${message.senderId === payload?.userId ? 'flex-row-reverse' : ''}`}
                >
                  {showCheckboxesForMultiDelete && message.senderId === payload?.userId && (
                    <input
                      type='checkbox'
                      id={message._id}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (!e.target) return;
                        const checked = e.target?.checked;
                        if (checked) {
                          setSelectedMsgForMultiDel(prevData => [...prevData, String(message?._id)]);
                        } else {
                          setSelectedMsgForMultiDel(prevData => prevData.filter(item => item !== message?._id));
                        }
                      }}
                    />
                  )}
                  <span
                    className='border rounded-sm p-2 hover:cursor-pointer hover:outline outline-blue-300 flex flex-col gap-1'
                    data-id={message._id}
                    onClick={handleMessageClick}
                  >
                    <span className='text-[clamp(0.6rem,4vw,1rem)]'>{message.content}</span>
                    {selectedMsgId && selectedMsgId === message._id && (
                      <span className='text-gray-400 text-[clamp(0.4rem,4vw,0.7rem)]'>{dateTimeFormatter(message.createdAt)}</span>
                    )}
                  </span>
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
                    className='h-8 w-full bg-transparent px-2 outline-none placeholder:text-gray-500 rounded-md'
                  />
                </div>

                <Button
                  type='button'
                  onClick={sendMessage}
                  disabled={!text}
                  className='h-8 shrink-0 rounded-sm border-0 bg-blue-500 px-3 text-white hover:cursor-pointer hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-400'
                >
                  Send
                </Button>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}

export default ChatPage;
