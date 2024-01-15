import { Address, Contract, ContractAbi, EventLog, Web3PluginBase, validator } from 'web3';
import { CidStorageInterfaceAbi as defaultCidStorageInterfaceAbi } from './cid_storage_interface_abi';

import * as IPFS from './ipfs_core_wrapper';

/**
 * IpfsCidStoragePlugin is a plugin class extending Web3PluginBase,
 * used to interact with IPFS and Ethereum smart contracts for storing and
 * retrieving CIDs (Content Identifiers).
 */
export class IpfsCidStoragePlugin extends Web3PluginBase {
	public pluginNamespace: string;
	private readonly _cidStorageAbi: ContractAbi;
	private readonly _cidStorageAddress: string;
	private readonly _ipfsClient: any;

	/**
	 * Constructs an instance of IpfsCidStoragePlugin with optional configuration
	 * for the plugin namespace, CID storage interface ABI, and CID storage contract address.
	 * @param options Optional configuration object.
	 */
	public constructor(options?: {
		pluginNamespace?: string;
		cidStorageInterfaceAbi?: ContractAbi;
		cidStorageAddress?: string;
		ipfsHost?: string;
		ipfsPort?: number;
		ipfsProtocol?: string;
		ipfsAuthToken ?: string;
	}) {
		super();
		this.pluginNamespace = options?.pluginNamespace ?? 'ipfsCidStorage';
		this._cidStorageAbi = options?.cidStorageInterfaceAbi ?? defaultCidStorageInterfaceAbi;
		if (options && options.cidStorageAddress && validator.isAddress(options.cidStorageAddress)) {
			this._cidStorageAddress = options.cidStorageAddress;
		} else {
			// default contract at sepolia test network https://sepolia.etherscan.io/address/0xa683bf985bc560c5dc99e8f33f3340d1e53736eb#code
			this._cidStorageAddress = '0xA683BF985BC560c5dc99e8F33f3340d1e53736EB';
		}
		this._ipfsClient = IPFS.create({
			host: options?.ipfsHost ?? '127.0.0.1',
			port: options?.ipfsPort ?? 5001,
			protocol: options?.ipfsProtocol ?? 'http',
			headers: options?.ipfsAuthToken ? {
			  authorization: 'Bearer ' + options?.ipfsAuthToken
			} : undefined
		  });
	}

	/**
	 * Uploads a file to IPFS and stores its CID in the Ethereum contract.
	 * @param filePath The path of the file to be uploaded.
	 * @param options Optional parameters including file buffer encoding.
	 * @returns The CID of the uploaded file.
	 */
	public async uploadFileAndStoreCid(
		fileInformation: { filePath?: string; fileName: string; fileBlob?: Blob },
		options?: {
			fileBufferEncoding?: BufferEncoding;
		},
	): Promise<string> {
		if (!fileInformation.filePath && !fileInformation.fileName && !fileInformation.fileBlob) {
			throw new Error('FilePath and fileName are required.');
		}
		const filePayload: string = await this._loadFileFromLocalStorage(
			fileInformation,
			options?.fileBufferEncoding,
		);
		const cid: string = await this._uploadDataIntoIpfs(filePayload, fileInformation.fileName);
		if (!cid) {
			throw new Error('Failed to upload data into IPFS.');
		}
		await this._storeCidIntoContract(cid);
		return cid;
	}

	/**
	 * Retrieves all stored CIDs from the Ethereum contract that match a specific
	 * address and are within the specified block range.
	 * @param address The address to filter the events by.
	 * @param fromBlock The starting block number to search for events (inclusive).
	 * @param toBlock The ending block number to search for events (inclusive).
	 * @returns An array of CIDs.
	 */
	public async getAllStoredCids(
		address: Address,
		fromBlock?: number,
		toBlock?: number,
	): Promise<string[]> {
		if (!address && validator.isAddress(address)) {
			throw new Error('Address is required.');
		}
		const contract: Contract<typeof defaultCidStorageInterfaceAbi> = new Contract(
			this._cidStorageAbi,
			this._cidStorageAddress,
		);
		contract.link(this);
		const cidEvents: (string | EventLog)[] = await contract.getPastEvents('CIDStored', {
			filter: { owner: address },
			fromBlock: fromBlock ?? 0,
			toBlock: toBlock ?? 'latest',
		});

		if (!cidEvents.length) {
			return [];
		}

		const cids: string[] = this._extractCidFromCidEvents(cidEvents);
		return cids;
	}

	/**
	 *
	 * @param events
	 * @returns
	 */
	private _extractCidFromCidEvents(events: (string | EventLog)[]): string[] {
		return events.map((event: string | EventLog) => {
			return (event as EventLog).returnValues['cid'] as string;
		});
	}

	private async _loadFileFromBrowser(file?: Blob, encoding?: BufferEncoding): Promise<string> {
		if (!file) {
			throw new Error('File blob should not be empty');
		}
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				resolve(reader.result as string);
			};
			reader.onerror = () => {
				reject(new Error('Error reading file'));
			};
			reader.readAsText(file, encoding);
		});
	}
	/**
	 * Loads a file from the local file system.
	 * @param filePath The path of the file to load.
	 * @param encoding The encoding of the file.
	 * @returns The file content as a string.
	 */
	private async _loadFileFromLocalStorage(
		fileInformation: { filePath?: string; fileName: string; fileBlob?: Blob },
		encoding?: BufferEncoding,
	): Promise<string> {
		if (typeof window === 'undefined') {
			if (!fileInformation.filePath || !fileInformation.fileName) {
				throw new Error('FilePath and fileName should not be empty');
			}
			try {
				const fs = await import('fs');
				const filePayload = await fs.readFileSync(
					fileInformation.filePath + fileInformation.fileName,
					encoding ?? 'utf-8',
				);
				return filePayload;
			} catch (error: any) {
				if (error.code === 'ENOENT') {
					throw new Error('File not found: ' + fileInformation.filePath);
				} else if (error.code === 'EACCES') {
					throw new Error('Access denied for file: ' + fileInformation.filePath);
				} else {
					throw new Error('Error reading file: ' + error.message);
				}
			}
		} else {
			return this._loadFileFromBrowser(fileInformation.fileBlob, encoding);
		}
	}

	/**
	 * Uploads a string of data to IPFS and returns the corresponding CID.
	 * @param data The string data to upload to IPFS.
	 * @returns The CID of the uploaded data.
	 */
	private async _uploadDataIntoIpfs(
		data: string, fileName: string
		): Promise<string> {
		if (!data && !fileName) {
			throw new Error('File payload is empty.');
		}
		const file = await this._ipfsClient.add({
			path: fileName,
			content: new TextEncoder().encode(data),
		});
		return file.cid.toString();
	
	}

	/**
	 * Stores a given CID in the Ethereum contract.
	 * @param cid The CID to be stored in the contract.
	 */
	private async _storeCidIntoContract(cid: string): Promise<void> {
		const contract: Contract<typeof defaultCidStorageInterfaceAbi> = new Contract(
			this._cidStorageAbi,
			this._cidStorageAddress,
			this,
		);
		contract.link(this);
		const walletPublicKey = contract.wallet![0]?.address;
		if (!walletPublicKey) {
			throw new Error('Please connect a wallet');
		}
		if (contract.methods.store !== undefined) {
			await contract.methods.store(cid).call({
				from: walletPublicKey
			});
			return;
		}
		throw new Error('Unable to store CID, provided cidStorageAbi is missing store method');
	}
}

// Module Augmentation
declare module 'web3' {
	interface Web3Context {
		ipfsCidStorage: IpfsCidStoragePlugin;
	}
}
