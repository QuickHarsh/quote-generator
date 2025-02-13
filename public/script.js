let currentQuote = "";
let currentAuthor = "";
let currentId = "";

const fetchQuote = async () => {
    const response = await fetch('http://localhost:3000/random-quote');
    const data = await response.json();
    const quoteElement = document.getElementById('quote');
    const authorElement = document.getElementById('author');

    quoteElement.classList.remove('fade-in');
    setTimeout(() => {
        quoteElement.innerText = `"${data.text}"`;
        authorElement.innerText = `~ ${data.author || "Anonymous"}`;
        quoteElement.classList.add('fade-in');
    }, 100);

    currentQuote = data.text;
    currentAuthor = data.author || "Anonymous";
    currentId = data._id;
    document.getElementById('likeCount').innerText = data.likes || 0;
    updateShareLinks(currentQuote, currentAuthor);
};

const addQuote = async () => {
    const newQuote = document.getElementById('newQuote').value.trim();
    const authorName = document.getElementById('authorName').value.trim() || "Anonymous";

    if (!newQuote) {
        alert("Please enter a quote!");
        return;
    }

    await fetch('http://localhost:3000/add-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote: newQuote, author: authorName })
    });

    alert("Quote added successfully!");
    document.getElementById('newQuote').value = "";
    document.getElementById('authorName').value = "";
};

const copyQuote = () => {
    navigator.clipboard.writeText(`${currentQuote} - ${currentAuthor}`);
    alert("Quote copied to clipboard!");
};

const likeQuote = async () => {
    if (!currentId) return alert("Get a quote first!");
    await fetch('http://localhost:3000/like-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentId })
    });

    fetchQuote();
};

const updateShareLinks = (quote, author) => {
    const text = encodeURIComponent(`"${quote}" - ${author}`);
    document.getElementById('whatsapp-share').href = `https://api.whatsapp.com/send?text=${text}`;
    document.getElementById('twitter-share').href = `https://twitter.com/intent/tweet?text=${text}`;
    document.getElementById('facebook-share').href = `https://www.facebook.com/sharer/sharer.php?u=${text}`;
};
