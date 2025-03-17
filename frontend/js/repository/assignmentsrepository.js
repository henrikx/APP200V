import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

class AssignmentsRepository {
    constructor(app) {
        this.db = getFirestore(app);
    }

    async getAssignments(assignmentId = null) {
        let [assignmentsSnap, rolesSnap, userAssignSnap] = [null, null, null];
        if (assignmentId) {
            [assignmentsSnap, rolesSnap, userAssignSnap] = await this.getSingleAssignmentSnaps(assignmentId);
        } else {
            [assignmentsSnap, rolesSnap, userAssignSnap] = await this.getAllAssignmentSnaps();
        }
        
        // Map assignments by their ID for quick lookup
        const assignmentsMap = {};
        assignmentsSnap.forEach((doc) => {
            assignmentsMap[doc.id] = doc.data();
        });
    
        // Sum the capacities for each assignment by iterating through each role
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
            assignmentRolesMap[assignmentId] = {
                ...assignmentRolesMap[assignmentId],
                [roleDoc.id]: roleDoc.data()
            }; 
        });
    
        // Count how many users have signed up for each assignment via its roles
        const assignmentUsageMap = {};
        userAssignSnap.forEach((uaDoc) => {
        const { assignmentRoleId } = uaDoc.data();
        if (!assignmentRoleId) return;
        // Find the corresponding role document to get its assignmentId
        const roleRef = rolesSnap.docs.find(d => d.id === assignmentRoleId);
        if (!roleRef) return;
        const roleData = roleRef.data();
        const assignmentId = roleData.assignmentId;
        if (!assignmentId) return;
        if (!assignmentUsageMap[assignmentId]) {
            assignmentUsageMap[assignmentId] = 0;
        }
        assignmentUsageMap[assignmentId]++;
        });
    
        return [
            assignmentsMap,
            assignmentCapacityMap,
            assignmentUsageMap,
            assignmentRolesMap
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
        const docRef = doc(this.db, "assignments", assignmentId);
        const assignmentSnap = [ await getDoc(docRef) ];

        const rolesPromise = getDocs(
            query(collection(this.db, "assignmentRole"), where("assignmentId", "==", assignmentId))
          );
          const userAssignPromise = getDocs(
            query(collection(this.db, "userAssignment"), where("assignmentId", "==", assignmentId))
          );
        
          const [rolesSnap, userAssignSnap] = await Promise.all([
            rolesPromise,
            userAssignPromise
          ]);

          
        return [assignmentSnap, rolesSnap, userAssignSnap];
    }
}

export { AssignmentsRepository };