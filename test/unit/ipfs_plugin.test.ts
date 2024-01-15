import { ipfsAddSpyFunction, readFileSyncSpyFunction, requestManagerSendSpy } from './mocks';
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

		beforeAll(() => {
			const httpProvider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
			web3Context = new Web3(httpProvider);
		
			web3Context.eth.accounts.wallet.add(
				'0x79b44119f978eea2774f413686eef67b16c64a9db052a1a986cab3f04a4adb1b',
			);
			web3Context.registerPlugin(new IpfsCidStoragePlugin());
			web3Context.ipfsCidStorage.requestManager.send = requestManagerSendSpy;
			
		});

		beforeEach(() => {
			jest.restoreAllMocks();
		});

		it('should call ipfsCidStorage.uploadFileAndStoreCid with a file path and upload a cid with a correct rpc object', async () => {
			readFileSyncSpyFunction.mockReturnValue('Hello');
			ipfsAddSpyFunction.mockReturnValue({ cid: 'cid' });
			const filePath = '/';
			const fileName = 'test.txt';
			const cid = await web3Context.ipfsCidStorage.uploadFileAndStoreCid({filePath, fileName});
			expect(readFileSyncSpyFunction).toHaveBeenLastCalledWith(filePath + fileName, 'utf-8');
			expect(requestManagerSendSpy).toHaveBeenCalledWith({
				method: 'eth_call',
				params: [
					{
						data: '0x131a0680000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000036369640000000000000000000000000000000000000000000000000000000000',
						to: "0xA683BF985BC560c5dc99e8F33f3340d1e53736EB",
						from: "0xB799Df591Ac20c32803Ad88A2A9F55328AFa63f5"
					},
					'latest',
				],
			});
			expect(cid).toEqual('cid')
		});

		it('should call ipfsCidStorage.getAllStoredCids event with correct rpc object', async () => {
			readFileSyncSpyFunction.mockReturnValue('Hello');
			ipfsAddSpyFunction.mockReturnValue({ cid: 'cid' });
			//Fix it
			// await web3Context.ipfsCidStorage.getAllStoredCids(
			// 	'0xcaC09FB0678255947EA755ae6F168331533BbBA4',
			// );
			
		});
	});
});
