const readFileSyncSpyFunction = jest.fn();
const createIpfsSpyFunction = jest.fn();
const ipfsAddSpyFunction = jest.fn();
const requestManagerSendSpy = jest.fn();
const nonceSpy = jest.fn();
const getPastEventSpyFunction = jest.fn()
nonceSpy.mockReturnValue({startsWith: jest.fn()})
createIpfsSpyFunction.mockReturnValue({
	add: ipfsAddSpyFunction,
});

jest.mock('../../src/ipfs_core_wrapper', () => ({
	create: createIpfsSpyFunction,
}));
jest.mock('fs', () => ({
	readFileSync: readFileSyncSpyFunction,
}));

// Export your mocks
export {
	requestManagerSendSpy,
	ipfsAddSpyFunction,
	createIpfsSpyFunction,
	readFileSyncSpyFunction,
};
