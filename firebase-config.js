// Shared Firebase config for admin panel + redirect page
const firebaseConfig = {
  apiKey: "AIzaSyCHDfcLYGqDwUY0tuDQTiQpmP3n0EsORJU",
  authDomain: "fir-test-project-7b84e.firebaseapp.com",
  databaseURL: "https://fir-test-project-7b84e-default-rtdb.firebaseio.com",
  projectId: "fir-test-project-7b84e",
  storageBucket: "fir-test-project-7b84e.firebasestorage.app",
  messagingSenderId: "593405735328",
  appId: "1:593405735328:web:364d3f999efb2be43034c5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
