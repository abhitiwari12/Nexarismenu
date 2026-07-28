const fs = require('fs');

function replaceInFile(filepath, replacements) {
    let content = fs.readFileSync(filepath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.split(search).join(replace);
    }
    fs.writeFileSync(filepath, content);
}

replaceInFile('src/components/Sidebar.tsx', [
    ['₹199', '₹299']
]);

replaceInFile('src/components/SubscriptionManager.tsx', [
    ['₹199', '₹299'],
    ['amount={199}', 'amount={299}'],
    ['price: 199', 'price: 299']
]);

replaceInFile('src/components/AdminPanel.tsx', [
    ['₹199', '₹299'],
    ['199)', '299)']
]);

replaceInFile('src/components/LandingPage.tsx', [
    ['₹199', '₹299']
]);

replaceInFile('src/components/AuthModal.tsx', [
    ['₹499', '₹299'],
    ['amount={499}', 'amount={299}']
]);

replaceInFile('src/firebase/firestoreService.ts', [
    ['price: 199', 'price: 299'],
    ['amount: 199', 'amount: 299'],
    ['₹199', '₹299']
]);

console.log('Done');
