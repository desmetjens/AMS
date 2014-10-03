$(function() {
    var client = new WindowsAzure.MobileServiceClient('https://developerquiz.azure-mobile.net/', 'REDfMMXQwhzDjWNweeIAtszBzrfFjG52'),
        quizTable = client.getTable('QuizDefinitions'), 
		questionsTable = client.getTable('QuestionDefinitions'),
		answersTable = client.getTable('AnswerDefinitions');

		var questions = [],current=0,answers = [];
		
    // Read current data and rebuild UI.
    // If you plan to generate complex UIs like this, consider using a JavaScript templating library.
    function refreshQuizzes() {
        var query = quizTable.where({ isactive: true });

        query.read().then(function(quizDefinition) {
            var listItems = $.map(quizDefinition, function(item) {
                return $('<li>')
                    .attr('data-quiz-id', item.Id)
                    .append($('<button class="quiz-start">Start</button>'))
                    .append($('<div>').append($('<label class="item-text">').text(item.Name)));
            });

            $('#quizzes').empty().append(listItems).toggle(listItems.length > 0);
            $('#summary').html('<strong>' + quizDefinition.length + '</strong> item(s)');
        }, handleError);
    }

    function handleError(error) {
        var text = error + (error.request ? ' - ' + error.request.status : '');
        $('#errorlog').append($('<li>').text(text));
    }

    function getQuizDefId(formElement) {
        return $(formElement).closest('li').attr('data-quiz-id');
    }

	function getAnswers(order,id,last){
		 var query = answersTable.where({ question_id: id }).read().then(function(results) {
			questions[order].Answers = results;
			if(last){
				showQuestion();
			}
		 },handleError);
	}
	
	function showQuestion(){
		var listItems =  $('<div>')
						.attr('data-question-id', questions[current].Id)
						.append($('<div>')
						.append($('<h3 class="item-text">').text(questions[current].QuestionTitle))
						.append($('<label class="item-text">').text(questions[current].Question))
						.append($('<div id="answers">')));
				
				$('#quizzes').hide()
				$('#questionContainer').empty().append(listItems).toggle(listItems.length > 0);
				$.each(questions[0].Answers, function(index,value){
					$('#answers').append($('<input type="radio" name="answers">').attr('value',value.Id)).append(value.AnswerName).append($('<br/>'));
				});
				var label = "Volgende";
				if(current==questions.length-1)
					label = "Beëindigen";
					
				$('#answers').append($('<button id="next" type="button" />').append(label));
				$('#summary').html('<strong>(vraag '+(current+1)+ ' van '+ questions.length+')</strong>');
	}
	
      // Handle start
    $(document.body).on('click', '.quiz-start', function () {
		var quizId = getQuizDefId(this);
		 var query = questionsTable.where({ quiz_id: quizId }).read().then(function(results) {
			for (i = 0; i < results.length; i++) { 
				questions[i] = results[i];
				getAnswers(i,results[i].Id,i==results.length-1);
			}
					
	}, handleError);
       
    });

	function finalizeQuiz(){
		// foreach answer --> write to table
		
		$('#questionContainer').empty().append("Bedankt om de quiz te vervolledigen");
		$('#summary').html("Einde");
	}
	
	$(document.body).on('click', '#next', function () {
		if($("input[type=radio]:checked").length == 0){
			$('#errorlog').append($('<li>').text('please select an answer'));
			return;
		}
		
		var answerId=$("input[type=radio]:checked")[0].value;
		answers[questions[current].Id] = answerId;
	
		if(current == questions.length-1){
			//finalize
			finalizeQuiz();
		}else{
			current++;
			showQuestion();
		}
			      
    });
	
    // On initial load, start by fetching the current data
    refreshQuizzes();
});