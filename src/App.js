/*
 * We are going to be using the useEffect hook!
 */
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import React, { useEffect,useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import idl from './idl.json';
import './App.css';
import kp from './keypair.json';



// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}

// All your other Twitter and GIF constants you had.


const getProvider = () => {
  const connection = new Connection(network, opts.preflightCommitment);
  const provider = new Provider(
    connection,
    window.solana,
    opts.preflightCommitment,
  );
  return provider;
};


// Change this up to be your Twitter if you want.
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  /*
   * This function holds the logic for deciding if a Phantom Wallet is
   * connected or not
   */
const [walletAddress, setWalletAddress] = useState(null);
const [inputValue, setInputValue] = useState('');
const [gifList, setGifList] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
           const response = await solana.connect({ onlyIfTrusted: true });
           console.log(
             'Connected with Public Key:',
             response.publicKey.toString(),
           );
           setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };


 const connectWallet = async () => {
   const { solana } = window;

   if (solana) {
     const response = await solana.connect();
     console.log('Connected with Public Key:', response.publicKey.toString());
     setWalletAddress(response.publicKey.toString());
   }
 };


const sendGif = async () => {
  if (inputValue.length === 0) {
    console.log('No gif link given!');
    return;
  }
  console.log('Gif link:', inputValue);
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);

    await program.rpc.addGif(inputValue, {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    });
    console.log('GIF successfully sent to program', inputValue);

    await getGifList();
  } catch (error) {
    console.log('Error sending GIF:', error);
  }
};

 const onInputChange = (event) => {
   const { value } = event.target;
   setInputValue(value);
 };
    /*
     * We want to render this UI when the user hasn't connected
     * their wallet to our app yet.
     */
    const renderNotConnectedContainer = () => (
      <button
        className="cta-button connect-wallet-button"
        onClick={connectWallet}
      >
        Connect to Wallet
      </button>
    );

const renderConnectedContainer = () => {
  // If we hit this, it means the program account hasn't be initialized.
  if (gifList === null) {
    return (
      <div className="connected-container">
        <button
          className="cta-button submit-gif-button"
          onClick={createGifAccount}
        >
          Do One-Time Initialization For GIF Program Account
        </button>
      </div>
    );
  }
  // Otherwise, we're good! Account exists. User can submit GIFs.
  else {
    return (
      <div className="connected-container">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendGif();
          }}
        >
          <input
            type="text"
            placeholder="Enter gif link!"
            value={inputValue}
            onChange={onInputChange}
          />
          <button type="submit" className="cta-button submit-gif-button">
            Submit
          </button>
        </form>
        <div className="gif-grid">
          {/* We use index as the key instead, also, the src is now item.gifLink */}
          {gifList.map((item, index) => (
            <div className="gif-item" key={index}>
              <img src={item.gifLink} />
            </div>
          ))}
        </div>
      </div>
    );
  }
};

useEffect(() => {
  const onLoad = async () => {
    await checkIfWalletIsConnected();
  };
  window.addEventListener('load', onLoad);
  return () => window.removeEventListener('load', onLoad);
}, []);

const getGifList = async () => {
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    const account = await program.account.baseAccount.fetch(
      baseAccount.publicKey,
    );

    console.log('Got the account', account);
    setGifList(account.gifList);
  } catch (error) {
    console.log('Error in getGifList: ', error);
    setGifList(null);
  }
};

const createGifAccount = async () => {
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    console.log('ping');
    await program.rpc.startStuffOff({
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [baseAccount],
    });
    console.log(
      'Created a new BaseAccount w/ address:',
      baseAccount.publicKey.toString(),
    );
    await getGifList();
  } catch (error) {
    console.log('Error creating BaseAccount account:', error);
  }
};

useEffect(() => {
  if (walletAddress) {
    console.log('Fetching GIF list...');
    getGifList();
  }
}, [walletAddress]);


  const TEST_GIFS = [
    'https://media4.giphy.com/media/PjVWEB5LvNn9K/giphy.gif?cid=ecf05e47wrkuk9542mhbyg9fs7azrpkbbiynoih03w2osjwy&rid=giphy.gif&ct=g',
    'https://media4.giphy.com/media/rysKgtdBt69pmAk7Rf/giphy.gif?cid=ecf05e47jtoja5wrd1reu38aq2bi99jzmquss5rzlp7t9s14&rid=giphy.gif&ct=g',
    'https://media1.giphy.com/media/eHKM1zH4JBMk/giphy.gif?cid=ecf05e47wrkuk9542mhbyg9fs7azrpkbbiynoih03w2osjwy&rid=giphy.gif&ct=g',
    'https://media3.giphy.com/media/tdQlpY2mYIoHm/giphy.gif?cid=ecf05e47mww4oga5y4bhkspvpsax116o57fpxvt8bdx9qqd3&rid=giphy.gif&ct=g',
  ];

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
