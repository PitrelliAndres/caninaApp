/**
 * Dummy data para mensajes de chat
 * Asociado a usuarios específicos de la base de datos
 */

// Chat 1: Conversación con Carlos
export const chatWithCarlos = {
  chat_id: 1,
  user: {
    id: 9,
    nickname: 'Carlos',
    avatar: 'https://i.pravatar.cc/150?img=3',
    is_online: true
  },
  messages: [
    {
      id: 'msg-1',
      sender_id: 9,
      receiver_id: 1,
      text: 'Hola! Vi que tambien tienes perro',
      created_at: new Date(Date.now() - 120 * 60000).toISOString(),
      time: '10:30',
      is_read: true
    },
    {
      id: 'msg-2',
      sender_id: 1,
      receiver_id: 9,
      text: 'Hola Carlos! Si, tengo un Golden Retriever',
      created_at: new Date(Date.now() - 115 * 60000).toISOString(),
      time: '10:35',
      is_read: true
    },
    {
      id: 'msg-3',
      sender_id: 9,
      receiver_id: 1,
      text: 'Genial! Yo tengo un Labrador. Como se llama el tuyo?',
      created_at: new Date(Date.now() - 110 * 60000).toISOString(),
      time: '10:40',
      is_read: true
    },
    {
      id: 'msg-4',
      sender_id: 1,
      receiver_id: 9,
      text: 'Se llama Max, tiene 3 anos. Y el tuyo?',
      created_at: new Date(Date.now() - 105 * 60000).toISOString(),
      time: '10:45',
      is_read: true
    },
    {
      id: 'msg-5',
      sender_id: 9,
      receiver_id: 1,
      text: 'El mio se llama Rocky, tiene 4 anos. Sueles ir al Parque Centenario?',
      created_at: new Date(Date.now() - 100 * 60000).toISOString(),
      time: '10:50',
      is_read: true
    },
    {
      id: 'msg-6',
      sender_id: 1,
      receiver_id: 9,
      text: 'Si, voy seguido por las tardes. Tu tambien?',
      created_at: new Date(Date.now() - 95 * 60000).toISOString(),
      time: '10:55',
      is_read: true
    },
    {
      id: 'msg-7',
      sender_id: 9,
      receiver_id: 1,
      text: 'Si! Generalmente voy despues de las 5pm. Te parece si nos encontramos un dia?',
      created_at: new Date(Date.now() - 90 * 60000).toISOString(),
      time: '11:00',
      is_read: true
    },
    {
      id: 'msg-8',
      sender_id: 1,
      receiver_id: 9,
      text: 'Me parece genial! Que tal manana a las 5:30pm?',
      created_at: new Date(Date.now() - 85 * 60000).toISOString(),
      time: '11:05',
      is_read: true
    },
    {
      id: 'msg-9',
      sender_id: 9,
      receiver_id: 1,
      text: 'Perfecto! Nos vemos en la zona de perros grandes',
      created_at: new Date(Date.now() - 80 * 60000).toISOString(),
      time: '11:10',
      is_read: true
    },
    {
      id: 'msg-10',
      sender_id: 1,
      receiver_id: 9,
      text: 'Dale! Llevo algunas pelotas para que jueguen',
      created_at: new Date(Date.now() - 75 * 60000).toISOString(),
      time: '11:15',
      is_read: true
    },
    {
      id: 'msg-11',
      sender_id: 9,
      receiver_id: 1,
      text: 'Excelente! Rocky va a estar feliz. Hasta manana!',
      created_at: new Date(Date.now() - 70 * 60000).toISOString(),
      time: '11:20',
      is_read: false // Último mensaje no leído
    }
  ]
}

// Chat 2: Conversación con Ana
export const chatWithAna = {
  chat_id: 2,
  user: {
    id: 10,
    nickname: 'Ana',
    avatar: 'https://i.pravatar.cc/150?img=5',
    is_online: false
  },
  messages: [
    {
      id: 'msg-12',
      sender_id: 10,
      receiver_id: 1,
      text: 'Hola! Vi tu perfil, que lindo perro tienes',
      created_at: new Date(Date.now() - 60 * 60000).toISOString(),
      time: '12:00',
      is_read: true
    },
    {
      id: 'msg-13',
      sender_id: 1,
      receiver_id: 10,
      text: 'Hola Ana! Gracias! Vi que tienes un Beagle, son hermosos',
      created_at: new Date(Date.now() - 55 * 60000).toISOString(),
      time: '12:05',
      is_read: true
    },
    {
      id: 'msg-14',
      sender_id: 10,
      receiver_id: 1,
      text: 'Si, se llama Toby. Es muy energetico pero super carinoso',
      created_at: new Date(Date.now() - 50 * 60000).toISOString(),
      time: '12:10',
      is_read: true
    },
    {
      id: 'msg-15',
      sender_id: 1,
      receiver_id: 10,
      text: 'Hace cuanto lo tienes?',
      created_at: new Date(Date.now() - 45 * 60000).toISOString(),
      time: '12:15',
      is_read: true
    },
    {
      id: 'msg-16',
      sender_id: 10,
      receiver_id: 1,
      text: 'Lo adopte hace 2 anos cuando era cachorro. Y tu?',
      created_at: new Date(Date.now() - 40 * 60000).toISOString(),
      time: '12:20',
      is_read: true
    },
    {
      id: 'msg-17',
      sender_id: 1,
      receiver_id: 10,
      text: 'El mio tiene 3 anos, lo tengo desde cachorro tambien',
      created_at: new Date(Date.now() - 35 * 60000).toISOString(),
      time: '12:25',
      is_read: true
    },
    {
      id: 'msg-18',
      sender_id: 10,
      receiver_id: 1,
      text: 'A que parque sueles llevarlo?',
      created_at: new Date(Date.now() - 30 * 60000).toISOString(),
      time: '12:30',
      is_read: true
    },
    {
      id: 'msg-19',
      sender_id: 1,
      receiver_id: 10,
      text: 'Generalmente voy al Parque Centenario o al Rivadavia',
      created_at: new Date(Date.now() - 25 * 60000).toISOString(),
      time: '12:35',
      is_read: true
    },
    {
      id: 'msg-20',
      sender_id: 10,
      receiver_id: 1,
      text: 'Yo tambien voy al Rivadavia! Esta cerca de casa',
      created_at: new Date(Date.now() - 20 * 60000).toISOString(),
      time: '12:40',
      is_read: true
    },
    {
      id: 'msg-21',
      sender_id: 1,
      receiver_id: 10,
      text: 'Que bueno! Podriamos encontrarnos algun dia',
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      time: '12:45',
      is_read: true
    },
    {
      id: 'msg-22',
      sender_id: 10,
      receiver_id: 1,
      text: 'Me encantaria! Podemos organizar una juntada de perros',
      created_at: new Date(Date.now() - 10 * 60000).toISOString(),
      time: '12:50',
      is_read: true
    },
    {
      id: 'msg-23',
      sender_id: 1,
      receiver_id: 10,
      text: 'Buena idea! Conozco otros duenos que podrian sumarse',
      created_at: new Date(Date.now() - 5 * 60000).toISOString(),
      time: '12:55',
      is_read: true
    },
    {
      id: 'msg-24',
      sender_id: 10,
      receiver_id: 1,
      text: 'Genial! Armemos un grupo para coordinar. Te paso mi WhatsApp?',
      created_at: new Date(Date.now() - 2 * 60000).toISOString(),
      time: '12:58',
      is_read: false // Último mensaje no leído
    }
  ]
}

// Función para obtener el chat dummy por ID
export function getDummyChatById(chatId) {
  const chatIdNum = parseInt(chatId)
  switch(chatIdNum) {
    case 1:
      return chatWithCarlos
    case 2:
      return chatWithAna
    default:
      // Si no hay datos, devolver un chat vacío
      return {
        chat_id: chatIdNum,
        user: {
          id: 0,
          nickname: 'Usuario',
          avatar: '/placeholder.svg',
          is_online: false
        },
        messages: []
      }
  }
}

// Lista de conversaciones dummy para la página de chats
export const dummyConversations = [
  {
    chat_id: 1,
    user: {
      id: 9,
      nickname: 'Carlos',
      avatar: 'https://i.pravatar.cc/150?img=3',
      is_online: true
    },
    last_message: 'Excelente! Rocky va a estar feliz. Hasta manana!',
    last_message_time: new Date(Date.now() - 70 * 60000).toISOString(),
    unread: 1
  },
  {
    chat_id: 2,
    user: {
      id: 10,
      nickname: 'Ana',
      avatar: 'https://i.pravatar.cc/150?img=5',
      is_online: false
    },
    last_message: 'Genial! Armemos un grupo para coordinar. Te paso mi WhatsApp?',
    last_message_time: new Date(Date.now() - 2 * 60000).toISOString(),
    unread: 1
  }
]