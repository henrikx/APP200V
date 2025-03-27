import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

class UserRepository {
    constructor(app) {
        this.db = getFirestore(app);
    }
    async getUser(userId) {
        const userSnap = await this.getSingleUserSnaps(userId);
        const userDoc = userSnap[0].data();

        return userDoc != null ? userDoc : null;
    }

    async getSingleUserSnaps(userId) {
        const docRef = doc(this.db, "users", userId);
        const userSnap = [await getDoc(docRef)];
        return userSnap;
    }
}

export { UserRepository };