Login page er en egen login.html

Etter login vil man bli omdirigert til oversiktsiden som da vil være index.html?page=oversikt. Dette håndteres av mainrouter.js og vil da laste inn pages/oversikt sin html, samt kjøre js fil oversikt.js.

**Due to limitations of the current implementation, it is important that the instance of this website is hsoted on a web-server and that the content root is the same directory as this directory! For example, the files `index.html`, `login.html`, `register.html` should be accessible in the following manner, respectively:**

- `https://example.com/index.html`
- `https://example.com/login.html`
- `https://example.com/register.html`


For security reasons, add the following rules to FireStore Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: get the user's role name from their user document
    function getUserRoleName() {
      let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return userDoc.userRole != null
        ? get(/databases/$(database)/documents/userroles/$(userDoc.userRole)).data.name
        : null;
    }

    function isManager() {
      return getUserRoleName() == "Manager";
    }
    function isEmployee() {
      return getUserRoleName() == "Employee";
    }
    function isAcceptedUser() {
      return isManager() || isEmployee();
    }

    // USERS COLLECTION
    match /users/{userId} {
      allow read: if request.auth != null && (isAcceptedUser() || request.auth.uid == userId);
      // Allow create if:
      // - The user is a manager
      // - OR the user is creating their own document AND does NOT set userRole
      allow create: if request.auth != null && (
        isManager() ||
        (request.auth.uid == userId && !("userRole" in request.resource.data))
      );
      allow delete: if request.auth != null && isManager();
      allow update: if request.auth != null && (
        isManager() ||
        // Employees can update their own profile, but not userRole
        (request.auth.uid == userId && !(("userRole" in request.resource.data) && (request.resource.data.userRole != resource.data.userRole)))
      );
    }

    // USERROLES COLLECTION
    match /userroles/{roleId} {
      allow read: if request.auth != null && isAcceptedUser();
      allow write: if false;
    }

    // ASSIGNMENTS COLLECTION
    match /assignments/{assignmentId} {
      allow read: if request.auth != null && isAcceptedUser();
      allow create, update, delete: if request.auth != null && isManager();
    }

    // ASSIGNMENTROLE COLLECTION
    match /assignmentRole/{roleId} {
      allow read: if request.auth != null && isAcceptedUser();
      allow create, update, delete: if request.auth != null && isManager();
    }

    // USERASSIGNMENT COLLECTION
    match /userAssignment/{userAssignmentId} {
      allow read: if request.auth != null && isAcceptedUser();
      allow create, update, delete: if request.auth != null && isManager();
    }
  }
}
```