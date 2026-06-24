import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, push, onValue, update, set, get } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } 
from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js"

const firebaseConfig = {
  apiKey: "AIzaSyCV4-Qx3jDmFmSx4BU8bq-j7MfR-hhSTUk",
  authDomain: "slapp-ed.firebaseapp.com",
  databaseURL: "https://slapp-ed-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "slapp-ed",
  storageBucket: "slapp-ed.firebasestorage.app",
  messagingSenderId: "707153744912",
  appId: "1:707153744912:web:247948827b6026bcb72695"
}

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)
const auth = getAuth(app)

// ===== TOAST SYSTEM =====
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container')
    const toast = document.createElement('div')
    toast.className = `toast ${type}`
    toast.textContent = message
    container.appendChild(toast)
    setTimeout(() => {
        if (toast.parentNode) toast.remove()
    }, 3000)
}

// ========== DOM ELEMENTS ==========
const emailEl = document.getElementById("email")
const passwordEl = document.getElementById("password")
const signupBtn = document.getElementById("signup-btn")
const loginBtn = document.getElementById("login-btn")
const logoutBtn = document.getElementById("logout-btn")
const authSection = document.getElementById("auth-section")
const appSection = document.getElementById("app-section")
const userEmailSpan = document.getElementById("user-email")
const currentListNameEl = document.getElementById("current-list-name")
const newListBtn = document.getElementById("new-list-btn")
const shareListBtn = document.getElementById("share-list-btn")
const joinListInput = document.getElementById("join-list-input")
const joinListBtn = document.getElementById("join-list-btn")
const inputFieldEl = document.getElementById("input-field")
const addButtonEl = document.getElementById("add-button")
const shoppingListEl = document.getElementById("shopping-list")
const categoryEl = document.getElementById("category")
const quantityEl = document.getElementById("quantity")

let currentUser = null
let currentListId = null
let currentListRef = null       // points to the items location (either personal or shared)
let currentListMembersRef = null
let isSharedList = false

// ========== AUTH ==========
signupBtn.addEventListener("click", () => {
    if (!emailEl.value || !passwordEl.value) {
        showToast("Please enter email and password", "error")
        return
    }
    createUserWithEmailAndPassword(auth, emailEl.value, passwordEl.value)
        .then(() => showToast("Account created! Welcome 🎉"))
        .catch(err => showToast(err.message, "error"))
})

loginBtn.addEventListener("click", () => {
    if (!emailEl.value || !passwordEl.value) {
        showToast("Please enter email and password", "error")
        return
    }
    signInWithEmailAndPassword(auth, emailEl.value, passwordEl.value)
        .then(() => showToast("Logged in successfully"))
        .catch(err => showToast(err.message, "error"))
})

logoutBtn.addEventListener("click", () => {
    signOut(auth)
        .then(() => showToast("Logged out"))
        .catch(err => showToast(err.message, "error"))
})

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user
        userEmailSpan.textContent = user.email
        authSection.style.display = "none"
        appSection.style.display = "block"
        switchToDefault()
    } else {
        currentUser = null
        authSection.style.display = "block"
        appSection.style.display = "none"
        shoppingListEl.innerHTML = ""
        currentListId = null
        currentListRef = null
        currentListMembersRef = null
        isSharedList = false
    }
})

// ========== LIST MANAGEMENT ==========
function switchToDefault() {
    isSharedList = false
    currentListId = "default"
    currentListRef = ref(database, `users/${currentUser.uid}/lists/default`)
    currentListMembersRef = null
    currentListNameEl.textContent = "My Personal List"
    loadItems()
}

function switchToSharedList(listId) {
    isSharedList = true
    currentListId = listId
    // Centralised items location
    currentListRef = ref(database, `shared_lists/${listId}/items`)
    currentListMembersRef = ref(database, `shared_lists/${listId}/members`)
    currentListNameEl.textContent = `List: ${listId.substring(0,8)}...`
    loadItems()
}

// NEW LIST (shared from the start)
newListBtn.addEventListener("click", () => {
    if (!currentUser) return
    const newListId = push(ref(database, `users/${currentUser.uid}/lists`)).key  // just to get a unique key
    // Create the shared list structure
    set(ref(database, `shared_lists/${newListId}/members/${currentUser.uid}`), true)
    set(ref(database, `list_ids/${newListId}`), true)
    switchToSharedList(newListId)
    showToast("New shared list created!")
})

// SHARE – either from default (copy to new shared list) or from an existing shared list
shareListBtn.addEventListener("click", async () => {
    if (!currentUser || !currentListId) return

    try {
        if (!isSharedList) {
            // We are on the personal default list – copy to a new shared list
            showToast("Creating a new shared list with your items…")
            await copyDefaultToNewSharedList()
            // After copy, we are now on a new shared list – its ID is already in currentListId
        }

        // Now we are definitely on a shared list
        // Ensure the list_ids marker exists (just in case)
        const publicRef = ref(database, `list_ids/${currentListId}`)
        const publicSnap = await get(publicRef)
        if (!publicSnap.exists()) {
            await set(publicRef, true)
        }

        // Copy list ID to clipboard
        navigator.clipboard.writeText(currentListId).then(() => {
            showToast("List ID copied to clipboard! 📋")
        }).catch(() => {
            showToast("Share this List ID: " + currentListId)
        })
    } catch (err) {
        showToast("Error sharing list: " + err.message, "error")
    }
})

async function copyDefaultToNewSharedList() {
    const defaultRef = ref(database, `users/${currentUser.uid}/lists/default`)
    const snapshot = await get(defaultRef)
    const defaultData = snapshot.val() || {}

    const newListId = push(ref(database, `users/${currentUser.uid}/lists`)).key
    // Set up new shared list
    await set(ref(database, `shared_lists/${newListId}/members/${currentUser.uid}`), true)
    await set(ref(database, `list_ids/${newListId}`), true)

    // Copy items from default to the central shared location
    const items = Object.entries(defaultData).filter(([key, value]) =>
        typeof value === "object" && value.name
    )
    for (const [, item] of items) {
        await push(ref(database, `shared_lists/${newListId}/items`), {
            name: item.name,
            category: item.category || "General",
            quantity: item.quantity || 1,
            bought: item.bought || false
        })
    }

    // Switch the UI to the new shared list
    switchToSharedList(newListId)
}

// JOIN LIST – now only adds membership, no per-user mirror
joinListBtn.addEventListener("click", async () => {
    const listId = joinListInput.value.trim()
    if (!listId) {
        showToast("Enter a valid List ID", "error")
        return
    }
    try {
        // Check existence via public list_ids
        const idSnapshot = await get(ref(database, `list_ids/${listId}`))
        if (!idSnapshot.exists()) {
            showToast("List not found", "error")
            return
        }

        // Add current user as member (rules allow newData to include self)
        await set(ref(database, `shared_lists/${listId}/members/${currentUser.uid}`), true)

        // Switch to the shared list (no per-user copy)
        switchToSharedList(listId)
        joinListInput.value = ""
        showToast("Joined list successfully!")
    } catch (err) {
        showToast("Error joining list: " + err.message, "error")
    }
})

// ========== ITEMS ==========
addButtonEl.addEventListener("click", addItem)

function addItem() {
    const inputValue = inputFieldEl.value.trim()
    if (!inputValue) {
        showToast("Please enter an item name", "error")
        return
    }
    const quantity = quantityEl.value || 1
    push(currentListRef, {
        name: inputValue,
        category: categoryEl.value,
        quantity: Number(quantity),
        bought: false
    })
    .then(() => {
        inputFieldEl.value = ""
        quantityEl.value = 1
        showToast(`${inputValue} added`)
    })
    .catch(err => showToast("Error adding item: " + err.message, "error"))
}

function loadItems() {
    if (!currentListRef) return
    onValue(currentListRef, (snapshot) => {
        shoppingListEl.innerHTML = ""
        if (snapshot.exists()) {
            const data = snapshot.val()
            const items = Object.entries(data).filter(([key, value]) => typeof value === "object" && value.name)
            if (items.length === 0) {
                shoppingListEl.innerHTML = "<li style='justify-content:center; width:100%;'>No items yet</li>"
                return
            }
            items.forEach(([key, value]) => appendItem(key, value))
        } else {
            shoppingListEl.innerHTML = "<li style='justify-content:center; width:100%;'>No items yet</li>"
        }
    }, (error) => {
        console.error("Failed to load list:", error)
        showToast("Error loading list. Check console.", "error")
        shoppingListEl.innerHTML = "<li style='justify-content:center; width:100%; color:red;'>Error loading list</li>"
    })
}

function appendItem(itemId, itemData) {
    const li = document.createElement("li")
    // Store the data we need to update: list ID and item ID
    li.dataset.itemId = itemId
    li.dataset.listId = currentListId
    // The reference path depends on whether it's a shared list or personal
    li.dataset.isShared = isSharedList

    const detailsDiv = document.createElement("div")
    detailsDiv.className = "item-details"

    const nameSpan = document.createElement("span")
    nameSpan.className = "item-name" + (itemData.bought ? " bought" : "")
    nameSpan.textContent = itemData.name

    const quantitySpan = document.createElement("span")
    quantitySpan.className = "item-quantity"
    quantitySpan.textContent = `x${itemData.quantity || 1}`

    const categorySpan = document.createElement("span")
    categorySpan.className = "item-quantity"
    categorySpan.textContent = `(${itemData.category})`

    detailsDiv.appendChild(nameSpan)
    detailsDiv.appendChild(quantitySpan)
    detailsDiv.appendChild(categorySpan)
    li.appendChild(detailsDiv)

    li.addEventListener("click", () => {
        const listId = li.dataset.listId
        const itId = li.dataset.itemId
        const isShared = li.dataset.isShared === "true"  // string from dataset

        if (!listId || !itId) {
            showToast("Cannot update item – missing data", "error")
            return
        }

        // Build the correct reference depending on list type
        const itemRef = isShared
            ? ref(database, `shared_lists/${listId}/items/${itId}`)
            : ref(database, `users/${currentUser.uid}/lists/default/${itId}`)

        update(itemRef, { bought: !itemData.bought })
            .catch(err => showToast("Update failed: " + err.message, "error"))
    })

    shoppingListEl.appendChild(li)
}