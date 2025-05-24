import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  query,
  where,
  addDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

class AssignmentsRepository {
    constructor(app) {
        this.db = getFirestore(app);
    }

    // Add a user assignment (sign up user for a role in an assignment)
    async addUserAssignment(data) {
        // data: { assignmentId, assignmentRoleId, userId, roleName }
        const db = this.db;
        await addDoc(collection(db, "userAssignment"), data);
    }

    // Delete a user assignment (user leaves an assignment)
    async deleteUserAssignment(userAssignmentDocId) {
        const db = this.db;
        await deleteDoc(doc(db, "userAssignment", userAssignmentDocId));
    }

  async getAssignments(assignmentId = null) {
    let [assignmentsSnap, rolesSnap, userAssignSnap] = [null, null, null];
    if (assignmentId) {
      [assignmentsSnap, rolesSnap, userAssignSnap] = await this.getSingleAssignmentSnaps(assignmentId);
    } else {
      [assignmentsSnap, rolesSnap, userAssignSnap] = await this.getAllAssignmentSnaps();
    }

    const assignmentsMap = {};
    assignmentsSnap.forEach((doc) => {
      assignmentsMap[doc.id] = doc.data();
    });

    const assignmentCapacityMap = {};
    const assignmentRolesMap = {};
    rolesSnap.forEach((roleDoc) => {
      const { assignmentId, capacity } = roleDoc.data();
      if (!assignmentId) return;
      if (!assignmentCapacityMap[assignmentId]) {
        assignmentCapacityMap[assignmentId] = 0;
      }
      assignmentCapacityMap[assignmentId] += capacity;
      if (!assignmentRolesMap[assignmentId]) {
        assignmentRolesMap[assignmentId] = {};
      }
      assignmentRolesMap[assignmentId][roleDoc.id] = roleDoc.data();
    });

    const assignmentUsageMap = {};
    const userAssignmentMap = {};
    userAssignSnap.forEach((uaDoc) => {
      const { assignmentRoleId } = uaDoc.data();
      if (!assignmentRoleId) return;

      const roleRef = rolesSnap.docs.find(d => d.id === assignmentRoleId);
      if (!roleRef) return;
      const roleData = roleRef.data();
      const assignmentId = roleData.assignmentId;
      if (!assignmentId) return;

      if (!assignmentUsageMap[assignmentId]) {
        assignmentUsageMap[assignmentId] = 0;
      }
      assignmentUsageMap[assignmentId]++;

      if (!userAssignmentMap[assignmentId]) {
        userAssignmentMap[assignmentId] = {};
      }
      userAssignmentMap[assignmentId][uaDoc.id] = uaDoc.data();
    });

    return [
      assignmentsMap,
      assignmentCapacityMap,
      assignmentUsageMap,
      assignmentRolesMap,
      userAssignmentMap
    ];
  }

  async getAllAssignmentSnaps() {
    const [assignmentsSnap, rolesSnap, userAssignSnap] = await Promise.all([
      getDocs(collection(this.db, "assignments")),
      getDocs(collection(this.db, "assignmentRole")),
      getDocs(collection(this.db, "userAssignment"))
    ]);
    return [assignmentsSnap, rolesSnap, userAssignSnap];
  }

  async getSingleAssignmentSnaps(assignmentId) {
    const assignmentSnap = [await getDoc(doc(this.db, "assignments", assignmentId))];

    const rolesSnap = await getDocs(
      query(collection(this.db, "assignmentRole"), where("assignmentId", "==", assignmentId))
    );

    const userAssignSnap = await getDocs(
      query(collection(this.db, "userAssignment"), where("assignmentId", "==", assignmentId))
    );

    return [assignmentSnap, rolesSnap, userAssignSnap];
  }

  async createAssignmentWithRoles(assignment, roles) {
    const assignmentRef = await addDoc(collection(this.db, "assignments"), {
      name: assignment.name,
      description: assignment.description,
      timeStart: Timestamp.fromDate(new Date(assignment.timeStart)),
      timeEnd: Timestamp.fromDate(new Date(assignment.timeEnd))
    });

    for (const role of roles) {
      await addDoc(collection(this.db, "assignmentRole"), {
        assignmentId: assignmentRef.id,
        name: role.name,
        capacity: role.capacity
      });
    }

    return assignmentRef.id;
  }
}

export { AssignmentsRepository };
