App = {
  loading: false,
  contracts: {},

  load: async () => {
    await App.loadWeb3()
    await App.loadAccount()
    await App.loadContract()
    await App.render()
  },

  // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
  loadWeb3: async () => {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider
      web3 = new Web3(web3.currentProvider)
    } else {
      window.alert("Please connect to Metamask.")
    }
    // Modern dapp browsers...
    if (window.ethereum) {
      window.web3 = new Web3(ethereum)
      try {
        // Request account access if needed
        await ethereum.enable()
        // Acccounts now exposed
        web3.eth.sendTransaction({/* ... */})
      } catch (error) {
        // User denied account access...
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = web3.currentProvider
      window.web3 = new Web3(web3.currentProvider)
      // Acccounts always exposed
      web3.eth.sendTransaction({/* ... */})
    }
    // Non-dapp browsers...
    else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  },

  loadAccount: async () => {
    // Set the current blockchain account
    App.account = web3.eth.accounts[0]
  },

  loadContract: async () => {
    // Create a JavaScript version of the smart contract
    const election = await $.getJSON('Election.json')
    App.contracts.Election = TruffleContract(election)
    App.contracts.Election.setProvider(App.web3Provider)

    // Hydrate the smart contract with values from the blockchain
    App.election = await App.contracts.Election.deployed()
  },

  render: async () => {
    // Prevent double render
    if (App.loading) {
      return
    }

    // Update app loading state
    App.setLoading(true)

    // Render Account
    $('#account').html(App.account)

    // Render Tasks
    await App.renderTasks()
    await App.loadElectionPannel()

    // Update loading state
    App.setLoading(false)
  },

  loadElectionPannel : async () =>{
    const candidatePannel = $('#candidatePannel')
    const voterPannel = $('#voterPannel')
    const votingPannel = $("#votingPannel")

    const voting_count = await App.election.voting_count()
    const chairperson = await App.election.chairperson()
    const voting = await App.election.voting()
    const voter_count = await App.election.voter_count()

    for(var i = 1;i <= voter_count.toNumber(); i++){
      var dis = false
      var voterAddress = await App.election.voter_list(i)
      if(web3.eth.accounts[0] == voterAddress ){
        dis =true
      }
    }

    if(web3.eth.accounts[0] == chairperson )
    {
      if (voting == false && voting_count.toNumber() == 1 ){
        candidatePannel.show()
        voterPannel.show()
      }else{
        candidatePannel.hide()
        voterPannel.hide()
      }
      $("#votingPannel-1").show()
    }else{
      candidatePannel.hide()
      voterPannel.hide()
      $("#votingPannel-1").hide()
    }

    if(voting_count.toNumber() == 1 && voting == true && dis == true){
      votingPannel.show()
    }else{
      votingPannel.hide()
    }

    if (voting == false){
      if(voting_count.toNumber() == 1 ){
        $("#startVoting").show()
      }else{
        $("#startVoting").hide()
      }
      $("#stopVoting").hide()
    }else{
      $("#startVoting").hide()
      $("#stopVoting").show()
    }

  },

  renderTasks: async () => {
    const candidateCount = await App.election.candidate_count()
    $('#candidateCount').append(candidateCount.toNumber())

    const voterCount = await App.election.voter_count()
    $('#voterCounts').append(voterCount.toNumber())
  },

  getTheCandidateDetail : async () =>{
    const candidateAddress = $('#candidateGetAddress').val()
    const candidateName = $('#candidateGetName').val()
    await App.election.Add_candidate(candidateAddress,candidateName)
  },

  getTheVoterDetail : async () =>{
    const voterName =$('#voterGetName').val()
    const voterAddress =$('#voterGetAddress').val()
    const voterChance =$('#voterAllow').val()

    await App.election.Add_voter(voterAddress,voterName,voterChance)
  },

  changeTheVotingState : async () =>{
    const voting = await App.election.voting()
    if (voting == true){
      await App.election.start_voting(false)
    }else{
      await App.election.start_voting(true)
    }
  },

  voteCandidate : async () => {
    var selectedCandidate = $("#selectedCandidate").val()
    await App.election.Voting(selectedCandidate)
  },

  getElectionResult : async () =>{
    await App.election.Result()
  },

  setLoading: (boolean) => {
    App.loading = boolean
    const loader = $('#loader')
    const content = $('#content')
    if (boolean) {
      loader.show()
      content.hide()
    } else {
      loader.hide()
      content.show()
    }
  }
}

$(() => {
  $(window).load(() => {
    App.load()
  })
})
