import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

class UsersRepository {
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

  // Fetch all users from the Firestore 'users' collection
  async getUsers() {
    const usersSnapshot = await getDocs(collection(this.db, 'users'));
    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  }

  // Update a user's role by assigning the userRole property to the role ID
  async updateUserRole(userId, roleId) {
    const userDocRef = doc(this.db, 'users', userId);
    const roleDocRef = doc(this.db, 'userroles', roleId);

    // Ensure the role exists before assigning it
    const roleDoc = await getDoc(roleDocRef); // Use getDoc to fetch the role document
    if (!roleDoc.exists()) {
      throw new Error(`Role with ID ${roleId} does not exist.`);
    }

    // Update the user's userRole property to reference the role ID
    await setDoc(userDocRef, { userRole: roleId }, { merge: true });
  }

  // Delete a user from the Firestore 'users' collection
  async deleteUser(userId) {
    const userDocRef = doc(this.db, 'users', userId);
    await deleteDoc(userDocRef);
  }

  // Delete a user from the Firestore 'users' collection
  async deleteUser(userId) {
    const userDocRef = doc(this.db, 'users', userId);
    await deleteDoc(userDocRef);
  }
      // Fetch all roles from the Firestore 'userroles' collection
  async getUserRoles() {
    const rolesSnapshot = await getDocs(collection(this.db, 'userroles'));
    const roles = [];
    rolesSnapshot.forEach((doc) => {
      roles.push({ id: doc.id, ...doc.data() });
    });
    return roles;
  }
}

export { UsersRepository };