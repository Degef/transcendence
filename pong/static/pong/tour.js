document.addEventListener("DOMContentLoaded", function () {
    // Select all score input fields
    var scoreInputs = document.querySelectorAll(".score-input");
    console.log(scoreInputs);
  
    // Add event listener to each input field
    // scoreInputs.forEach(function (input) {
    //   input.addEventListener("change", updateNextRound);
    // });
  
    function createEventListners(scoreInputs) {
        scoreInputs.forEach(function (input) {
            input.addEventListener("change", updateNextRound);
          });
    }

    createEventListners(scoreInputs);

    function updateNextRound(event) {
      var changedInput = event.target;
      var currentMatchup = changedInput.closest(".matchup");
      console.log( Array.from(currentMatchup.querySelectorAll(".matchup")));
  
      // Get the teams and scores for the current matchup
      var teamTop = currentMatchup.querySelector(".team-top");
      var teamBottom = currentMatchup.querySelector(".team-bottom");
      var scoreTop = parseFloat(teamTop.querySelector(".score-input").value);
      var scoreBottom = parseFloat(teamBottom.querySelector(".score-input").value);
  
      // Determine the winner and update the next round
      if (!isNaN(scoreTop) && !isNaN(scoreBottom)) {
        var winner = scoreTop > scoreBottom ? teamTop : teamBottom;
        var loser = scoreTop > scoreBottom ? teamBottom : teamTop;
  
        updateNextMatchup(winner, loser);
      }
    }

    function updateMatchCell(nextCell, winnerName, winnerImg, winnerScore) {
        nextCell.innerHTML = "";
        nextCell.appendChild(winnerImg);
        nextCell.insertAdjacentHTML("beforeend", winnerName);
        nextCell.insertAdjacentHTML("beforeend", `<input class="score-input" type="number" value="${winnerScore}">`);
    }

    function updateNextMatchup(winner, loser) {
        // Find the current round
        var currentRound = winner.closest(".round");
        //   console.log( Array.from(currentRound.querySelectorAll(".matchup")).indexOf(winner.closest(".matchup")));
        
        // Find the index of the current matchup within its round
        var currentMatchupIndex = Array.from(currentRound.querySelectorAll(".matchup")).indexOf(winner.closest(".matchup"));

        // Determine whether it's the left or right side
        var isLeftSide = winner.closest(".split").classList.contains("split-one");

        // Find the next round
        var nextRound = isLeftSide ? currentRound.nextElementSibling : currentRound.previousElementSibling;
        var winnerImg = winner.querySelector("img").cloneNode(true);
        var winnerName = winner.textContent.trim();
            
        var winnerScore = "";

        // Check if the next round and matchup exist
        if (nextRound) {
            // Find the correct matchup in the next round based on the index
            var nextMatchups = nextRound.querySelectorAll(".matchup");
            var nextMatchupIndex = Math.floor(currentMatchupIndex / 2);
            var nextMatchup = nextMatchups[nextMatchupIndex];

            // Update the matchup with the winner and clear the loser
            if (nextMatchup) {
                var nextTeamTop = nextMatchup.querySelector(".team-top");
                var nextTeamBottom = nextMatchup.querySelector(".team-bottom");

                if (currentMatchupIndex === nextMatchupIndex) {
                    updateMatchCell(nextTeamTop, winnerName, winnerImg, winnerScore);
                } 
                else if (currentMatchupIndex === nextMatchupIndex + 1) {
                    updateMatchCell(nextTeamBottom, winnerName, winnerImg, winnerScore);
                }
                var newScoreInputs = nextMatchup.querySelectorAll(".score-input");
                createEventListners(newScoreInputs);
            }
        }
        else {
            // If there's no next round, update the championship matchup directly
            var championshipMatchup = document.querySelector(".championship.matchup");
            var championshipTeamTop = championshipMatchup.querySelector(".team-top");
            var championshipTeamBottom = championshipMatchup.querySelector(".team-bottom");

            // Set the championship teams' content and score inputs
            if (isLeftSide) {
                updateMatchCell(championshipTeamTop, winnerName, winnerImg, winnerScore);
            }
            else {
                updateMatchCell(championshipTeamBottom, winnerName, winnerImg, winnerScore);
            }
        }
    }

  });
  

