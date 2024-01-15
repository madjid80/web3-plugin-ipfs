import { Web3, Web3Eth, Web3Context } from 'web3';
import { IpfsCidStoragePlugin } from '../../src';

describe('IpfsCidStoragePlugin Unit Tests', () => {
	it('should register IpfsCidStoragePlugin plugin on Web3Context instance', () => {
		const web3Context = new Web3Context('http://127.0.0.1:7545');
		web3Context.registerPlugin(new IpfsCidStoragePlugin());
		expect(web3Context.ipfsCidStorage).toBeDefined();
	});

	it('should register IpfsCidStoragePlugin plugin on Web3Eth instance', () => {
		const web3Eth = new Web3Eth('http://127.0.0.1:7545');
		web3Eth.registerPlugin(new IpfsCidStoragePlugin());
		expect(web3Eth.ipfsCidStorage).toBeDefined();
	});

	describe('IpfsCidStoragePlugin method tests', () => {
		let web3Context: Web3;
		let requestManagerSendSpy: jest.SpyInstance;

		beforeAll(() => {
			// works with ganache

			const httpProvider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
			web3Context = new Web3(httpProvider);
			web3Context.eth.accounts.wallet.add(
				'0x79b44119f978eea2774f413686eef67b16c64a9db052a1a986cab3f04a4adb1b',
			);
			web3Context.registerPlugin(
				new IpfsCidStoragePlugin({
					cidStorageAddress: '0xcaC09FB0678255947EA755ae6F168331533BbBA4',
				}),
			);
			requestManagerSendSpy = jest.spyOn(web3Context.ipfsCidStorage.requestManager, 'send');
		});

		it('should call ipfsCidStorage.uploadFileAndStoreCid with a file path and upload a cid with a correct rpc object', async () => {
			const fileName = 'package.json';
			var blob = new Blob(['Hello'], { type: 'text/plain' });
			blob['name'] = fileName;
            
			const cid = await web3Context.ipfsCidStorage.uploadFileAndStoreCid({ fileBlob: blob, fileName });
			//fix it
			expect(cid).toEqual('cid');
		});

		// it('should call ipfsCidStorage.getAllStoredCids event with correct rpc object', async () => {
		// 	const cids = await web3Context.ipfsCidStorage.getAllStoredCids(
		// 		'0xcaC09FB0678255947EA755ae6F168331533BbBA4',
		// 	);
		// 	//fix it
		// });
	});
});
