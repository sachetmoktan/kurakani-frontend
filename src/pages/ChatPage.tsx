import { useEffect, useState } from 'react';
import useAuth from '../auth/useAuth';
import fetchApi from '../lib/api/fetch';
import notify from '../lib/toast/toast';
import { socket } from '../socket/socket';
import type { TUser } from '../types/auth.types';
import type { TApiResponse } from '../types/common.types';

type Message = {
  senderId: string;
  text: string;
};

function ChatPage() {
  const { setUser } = useAuth();

  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string>('');

  useEffect(() => {
    const handleReceiveMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const logoutData = await fetchApi<TApiResponse<TUser>>('/logout', {
        method: 'POST',
      });
      setUser(null);
      notify.success(logoutData.message);
    } catch (err) {
      notify.error(`${err}`);
    }
  };

  // Below code is good
  // User to button ma click garepaxi chai yo trigger hunuparyo
  const startConversation = (otherUserId: string) => {
    socket.emit('conversation:create', {
      otherUserId,
    });
  };

  useEffect(() => {
    const handleConversationCreated = ({ conversationId }: { conversationId: string }) => {
      console.log('Conversation created frontend:', conversationId);

      // Now join the conversation
      socket.emit('conversation:join', {
        conversationId,
      });

      // You can also save it in React state
      setConversationId(conversationId);
    };

    socket.on('conversation:created', handleConversationCreated);

    return () => {
      socket.off('conversation:created', handleConversationCreated);
    };
  }, []);

  useEffect(() => {
    const handleReceiveMessages = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    socket.on('message:new', handleReceiveMessages);

    return () => {
      socket.off('message:new', handleReceiveMessages);
    };
  }, []);

  const sendMessage = () => {
    if (!conversationId) return;

    if (!text.trim()) {
      return;
    }
    console.log('Sending Message', conversationId, text);
    socket.emit('message:send', {
      conversationId,
      content: text,
    });

    setText('');
  };

  return (
    <>
      <h1>chat page</h1>
      <div>
        <div>
          {messages.map((message, index) => (
            <div key={index}>
              <strong>{message.senderId}: </strong>
              {message.text}
            </div>
          ))}
        </div>
        <input
          value={text}
          onChange={event => setText(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              sendMessage();
            }
          }}
        />

        <button onClick={sendMessage}>Send</button>
        <button onClick={() => startConversation('6a993e435c05c18516352c4d')}>ChatWithAdmin</button>
        <button onClick={() => startConversation('6a99462cb73f978b7f52f7e5')}>ChatWithSachet</button>
      </div>

      <button type='button' onClick={handleLogout}>
        Logout
      </button>
    </>
  );
}

export default ChatPage;
