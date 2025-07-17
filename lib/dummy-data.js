// Datos simulados. Se actualizó la lista de razas y se agregaron visitas, matches y chats.

export const parks = [
  {
    id: 1,
    name: "Parque Centenario",
    neighborhood: "caballito",
    description: "Un gran pulmón verde con un lago, ideal para paseos largos y socializar.",
  },
  {
    id: 2,
    name: "Plaza Irlanda",
    neighborhood: "caballito",
    description: "Amplia plaza con un canil cercado muy popular entre los vecinos.",
  },
  {
    id: 3,
    name: "Parque Rivadavia",
    neighborhood: "caballito",
    description: "Famoso por su feria de libros, también tiene mucho espacio para perros.",
  },
  {
    id: 4,
    name: "Bosques de Palermo",
    neighborhood: "palermo",
    description: "El espacio verde más grande de la ciudad, con lagos y áreas para correr.",
  },
  {
    id: 5,
    name: "Plaza Inmigrantes de Armenia",
    neighborhood: "palermo",
    description: "Plaza concurrida en el corazón de Palermo Soho, con un canil bien mantenido.",
  },
  {
    id: 6,
    name: "Parque Las Heras",
    neighborhood: "palermo",
    description: "Muy popular para deportes y paseos, con un canil grande y activo.",
  },
  {
    id: 7,
    name: "Parque Lezama",
    neighborhood: "san telmo",
    description: "Histórico parque con barrancas y mucho espacio para explorar con tu mascota.",
  },
  {
    id: 8,
    name: "Plaza Dorrego",
    neighborhood: "san telmo",
    description: "El corazón de San Telmo, ideal para un paseo tranquilo entre semana.",
  },
]

export const dogBreeds = [
  "Mestizo",
  "Labrador Retriever",
  "Golden Retriever",
  "Bulldog Francés",
  "Bulldog Inglés",
  "Beagle",
  "Poodle",
  "Yorkshire Terrier",
  "Dachshund",
  "Boxer",
  "Cocker Spaniel",
  "Schnauzer",
  "Chihuahua",
  "Pug",
  "Maltés",
  "Shih Tzu",
  "Border Collie",
  "Husky Siberiano",
  "Gran Danés",
  "Rottweiler",
  "Pastor Alemán",
  "Otro",
]

export const interests = [
  "Paseos largos",
  "Juegos en el parque",
  "Entrenamiento",
  "Socialización",
  "Deportes caninos",
  "Caminatas",
  "Fotografía de mascotas",
  "Cuidados y salud",
  "Adopción responsable",
  "Eventos caninos",
]

export const profileData = {
  name: "Ana García",
  email: "ana.garcia@example.com",
  nickname: "Ani",
  age: 32,
  accountType: "Gratuita",
  memberSince: "17/07/2025",
  dog: {
    name: "Pipo",
    age: 4,
    breed: "Mestizo",
  },
  privacy: {
    isPublic: true,
    allowMatching: true,
    allowProximity: false,
  },
}

export const myVisits = [
  {
    id: 1,
    parkName: "Parque Centenario",
    date: "2025-07-20",
    time: "17:00",
    duration: "1 hora",
  },
  {
    id: 2,
    parkName: "Bosques de Palermo",
    date: "2025-07-22",
    time: "18:30",
    duration: "1 hora y media",
  },
  {
    id: 3,
    parkName: "Parque Las Heras",
    date: "2025-07-15",
    time: "09:00",
    duration: "30 minutos",
  },
]

export const matchProfiles = [
  {
    id: 1,
    compatibility: 92,
    user: { name: "María García", age: 32, avatarUrl: "/diverse-woman-smiling.png" },
    dog: { name: "Luna", breed: "Golden Retriever", age: 3 },
    lastSeen: "Parque Centenario",
    interests: ["Paseos largos", "Entrenamiento", "Socialización"],
  },
  {
    id: 2,
    compatibility: 87,
    user: { name: "Carlos Rodríguez", age: 45, avatarUrl: "/man-and-loyal-companion.png" },
    dog: { name: "Max", breed: "Labrador", age: 5 },
    lastSeen: "Bosques de Palermo",
    interests: ["Deportes caninos", "Caminatas", "Fotografía de mascotas"],
  },
  {
    id: 3,
    compatibility: 78,
    user: { name: "Ana Martínez", age: 28, avatarUrl: "/happy-person.png" },
    dog: { name: "Coco", breed: "Beagle", age: 2 },
    lastSeen: "Parque Las Heras",
    interests: ["Juegos en el parque", "Socialización", "Eventos caninos"],
  },
]

export const chats = [
  {
    id: 1,
    name: "María García",
    avatarUrl: "/diverse-woman-smiling.png",
    lastMessage: "Genial! Nos vemos mañana entonces 😊",
    lastMessageTime: "10:30",
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    avatarUrl: "/man-and-loyal-companion.png",
    lastMessage: "Sí, es un labrador negro muy juguetón",
    lastMessageTime: "Ayer",
    unreadCount: 0,
    isOnline: false,
  },
]

export const messages = {
  1: [
    { id: 1, sender: "other", text: "Hola! Vi que también vas al Parque Centenario", time: "09:15" },
    { id: 2, sender: "me", text: "Sí! Voy casi todos los días con mi perro", time: "09:20" },
    { id: 3, sender: "other", text: "¿A qué hora sueles ir?", time: "09:25" },
    { id: 4, sender: "me", text: "Generalmente por las tardes, tipo 17hs", time: "09:30" },
    { id: 5, sender: "other", text: "Perfecto! Yo también voy a esa hora", time: "10:00" },
    { id: 6, sender: "me", text: "Mañana voy a estar por ahí si quieres que nuestros perros jueguen", time: "10:15" },
    { id: 7, sender: "other", text: "Me parece genial! Mañana nos vemos", time: "10:25" },
    { id: 8, sender: "me", text: "Genial! Nos vemos mañana entonces 😊", time: "10:30" },
  ],
  2: [
    { id: 1, sender: "other", text: "Hola! Creo que vi a tu perro en el parque", time: "Ayer 15:30" },
    { id: 2, sender: "me", text: "Hola Carlos! Sí, seguro era Luna", time: "Ayer 16:00" },
    { id: 3, sender: "other", text: "Sí, es un labrador negro muy juguetón", time: "Ayer 16:15" },
  ],
}
