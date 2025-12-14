BidBazar - Auction House

A simple post feed application with authentication, search and CRUD functions. Users can register, log in, see their profile, edit their profile, create auctions, bid on auctions, edit them, delete them, and search and filter for auction.

Prerequisites:

You must have access to the Noroff API with an "Noroff API Key" from "https://docs.noroff.dev/docs/v2/auth/api-key" and a valid @stud.noroff.no email in order to fetch and view auctions.

Installation:

Option 1 -
You can download the project as a zip file and run it using VS Code Live Server, or serve with Node.js (npx serve).

Option 2 -
Clone the repository git clone https://github.com/kevindjenhansen/bidbazar-auction.git cd bidbazar-auction
Open the project folder in your editor of choice
Open index.html in your browser (Remember to replace the API key in the config.js if needed)

And if you just wanna try it out the project is launched on github pages at "https://kevindjenhansen.github.io/bidbazar-auction/index.html"

Scripts:
This project uses npm to manage development dependencies.

Install all dependencies

```bash
npm install
```

Compiles Tailwind in watch mode

```bash
npm run dev
```

Compiles and minifies Tailwind for production

```bash
npm run build
```

📜 License

This project is open-source under the MIT License.
