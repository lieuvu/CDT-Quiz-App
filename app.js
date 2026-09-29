$(document).ready(function () {

  console.log("Quiz App initialized.");


  // =========================================================
  // Application State
  // =========================================================

  let currentQuiz = null;
  let currentQuestionIndex = 0;

  // Stores the user's selected answer for each question.
  //
  // Example:
  // {
  //     "L1-Q001": "A",
  //     "L1-Q002": "C"
  // }
  //
  let userAnswers = {};

  // Stores the user's unanswered question index list
  let unansweredQuestionsIndex = new Set();

  // =========================================================
  // DOM Elements
  // =========================================================

  const $quizSelect = $("#quiz-select");
  const $loadQuizButton = $("#load-quiz-btn");
  const $loadStatus = $("#load-status"); //??

  const $quizInfo = $("#quiz-info");
  const $quizTitle = $("#quiz-title");
  const $quizDescription = $("#quiz-description");
  const $quizMeta = $("#quiz-meta");

  const $quizArea = $("#quiz-area");
  const $questionContainer = $("#question-container");

  const $questionProgress = $("#question-progress");
  const $quizProgressBar = $("#quiz-progress-bar");

  const $previousButton = $("#previous-btn");
  const $nextButton = $("#next-btn");
  const $submitContainer = $("#submit-container");

  const $submitButton = $("#submit-btn");

  const $unansweredModal = $("#unanswered-modal");
  const $unansweredQuestionList = $("#unanswered-question-list");

  const $resultsArea = $("#results-area");
  const $resultSummary = $("#result-summary");
  const $resultDetails = $("#result-details");
  const $restartButton = $("#restart-btn");


  // =========================================================
  // Quiz Selection
  // =========================================================

  $quizSelect.on("change", (event) => {
    const selectedFile = $(event.currentTarget).val();

    // Enable Load button only when a file is selected and quiz is not loaded
    const loadQuizButtonEnabled = selectedFile && !isQuizLoaded();
    enableLoadButton(loadQuizButtonEnabled)

    // Clear previous status
    hideStatus();
  });


  // =========================================================
  // Load Quiz Button
  // =========================================================

  $loadQuizButton.on("click", () => {
    if (isQuizLoaded()) {
      return
    }

    const filePath = $quizSelect.val();

    if (!filePath) {
      showError("Please select a question bank.");
      return;
    }

    loadQuiz(filePath);
  });

  // =========================================================
  // Previous Button
  // =========================================================

  $previousButton.on("click", () => {
    if (currentQuestionIndex <= 0) {
      return;
    }

    currentQuestionIndex--;
    renderCurrentQuestion();
  });

  // =========================================================
  // Next Button
  // =========================================================

  $nextButton.on("click", () => {
    const lastQuestionIdx = currentQuiz.questions.length - 1;

    if (currentQuestionIndex >= lastQuestionIdx) {
      return;
    }

    currentQuestionIndex++;
    renderCurrentQuestion();
  });

  // =========================================================
  // Submit Button
  // =========================================================

  $submitButton.on("click", () => submitQuiz());

  // =========================================================
  // Restart Button
  // =========================================================

  $restartButton.on("click", () => restartQuiz());


  // =========================================================
  // Load JSON File
  // =========================================================

  function loadQuiz(filePath) {
    // console.log("Loading quiz:", filePath);

    showLoading();

    $.getJSON(filePath)
      .done((data) => {

        // console.log("JSON loaded successfully:", data);

        // Validate the basic structure
        const validationResult = validateQuiz(data);

        if (!validationResult.valid) {
          showError(validationResult.message);
          currentQuiz = null;
          return;
        }

        // Store quiz in application state
        currentQuiz = data;

        // Disable load 
        enableLoadButton(false)

        // Display quiz information
        displayQuizInfo(currentQuiz);

        // Display quiz area
        $quizArea.removeClass("d-none");

        // Render question
        renderCurrentQuestion();

        showSuccess(`File "${currentQuiz.quiz.title}" loaded successfully.`);
      })
      .fail((jqXHR, textStatus, errorThrown) => {
        console.error(
          "Failed to load JSON:",
          textStatus,
          errorThrown
        );


        currentQuiz = null;

        resetAndHideQuizInfo();
        showError("Failed to load quiz!");

      });
  }


  // =========================================================
  // Validate Quiz
  // =========================================================

  function validateQuiz(data) {

    // Check that data exists
    if (!data) {
      return {
        valid: false,
        message: "The quiz file is empty."
      };

    }


    // Check quiz metadata
    if (!data.quiz) {
      return {
        valid: false,
        message: "Invalid quiz file: missing 'quiz' object."
      };

    }


    // Check quiz title
    if (!data.quiz.title) {
      return {
        valid: false,
        message: "Invalid quiz file: missing quiz title."
      };

    }


    // Check questions
    if (!Array.isArray(data.questions)) {
      return {
        valid: false,
        message: "Invalid quiz file: 'questions' must be an array."
      };

    }


    // Make sure there is at least one question
    if (data.questions.length === 0) {
      return {
        valid: false,
        message: "The quiz does not contain any questions."
      };

    }


    return {
      valid: true,
      message: ""
    };

  }


  // =========================================================
  // Display Quiz Information
  // =========================================================

  function displayQuizInfo(quizData) {
    $quizTitle.text(quizData.quiz.title);
    $quizDescription.text(quizData.quiz.description || "");

    const questionCount = quizData.questions.length;
    $quizMeta.text(
      `${questionCount} question${questionCount === 1 ? "" : "s"}`
    );


    // Show quiz information
    $quizInfo.removeClass("d-none");

    // We are NOT rendering questions yet.
    // That will happen in Step 5.
  }

  // =========================================================
  // Hide Quiz Information
  // =========================================================

  function resetAndHideQuizInfo() {
    const defaultTitle = "Quiz Title";
    const defaultDescription = "Quiz Description"
    const questionCount = 0;

    $quizTitle.text(defaultTitle);
    $quizDescription.text(defaultDescription);
    $quizMeta.text(
      `${questionCount} question${questionCount === 1 ? "" : "s"}`
    );


    // Hide quiz information
    $quizInfo.addClass("d-none");
  }

  // =========================================================
  // Render Current Question
  // =========================================================

  function renderCurrentQuestion() {
    if (!currentQuiz) {
      return;
    }

    const questions = currentQuiz.questions;
    const totalQuestions = questions.length;
    const question = questions[currentQuestionIndex];

    if (!question) {
      return;
    }

    // Clear previous question
    $questionContainer.empty();

    // Create question card
    const $questionCard = $("<div>").addClass("card shadow-sm");

    // Card body
    const $cardBody = $("<div>").addClass("card-body");

    // Question number
    const $questionNumber =
      $("<div>")
        .addClass("small text-body-secondary mb-2")
        .text(`Question ${currentQuestionIndex + 1} of ${totalQuestions}`);


    // Question text
    const $questionText =
      $("<h2>")
        .addClass("h4 mb-4")
        .text(question.question);


    // Options container
    const $optionsContainer = $("<div>").addClass("options-container");

    // Render each option
    question.options.forEach((option) => {
      const $option = createOption(question, option);
      $optionsContainer.append($option);
    });


    // Assemble card
    $cardBody.append($questionNumber);
    $cardBody.append($questionText);
    $cardBody.append($optionsContainer);

    $questionCard.append($cardBody);

    $questionContainer.append($questionCard);

    restoreSelectedAnswer();
    updateNavigationButtons();
    updateQuestionProgress();
  }

  // =========================================================
  // Create Answer Option
  // =========================================================

  function createOption(question, option) {
    const inputId = `question-${question.id}-option-${option.id}`;


    // Outer wrapper
    const $wrapper = $("<div>").addClass("mb-2");

    // Label
    const $label =
      $("<label>")
        .attr("for", inputId)
        .addClass("form-check border rounded p-3");


    // Radio input
    const $input =
      $("<input>")
        .attr({
          type: "radio",
          id: inputId,
          name: `question-${question.id}`,
          value: option.id,
        })
        .addClass("form-check-input me-2");

    $input.on("change", (event) => {
      const selectedAnswer = $(event.currentTarget).val();
      userAnswers[question.id] = selectedAnswer;
      unansweredQuestionsIndex.delete(currentQuestionIndex);
    });



    // Answer text
    const $text =
      $("<span>")
        .addClass("form-check-label")
        .text(option.text);


    $label.append($input);
    $label.append($text);

    $wrapper.append($label);

    return $wrapper;
  }

  // =========================================================
  // STEP 6 - Restore Selected Answer
  // =========================================================

  function restoreSelectedAnswer() {
    if (!currentQuiz) {
      return;
    }

    const question = currentQuiz.questions[currentQuestionIndex];

    if (!question) {
      return;
    }

    const selectedAnswer = userAnswers[question.id];

    if (!selectedAnswer) {
      return;
    }


    const selector =
      `input[name="question-${question.id}"]` +
      `[value="${selectedAnswer}"]`;


    $(selector).prop("checked", true);
  }

  // =========================================================
  // Update Navigation Buttons
  // =========================================================

  function updateNavigationButtons() {

    if (!currentQuiz) {
      return;
    }


    const lastQuestionIndex = currentQuiz.questions.length - 1;
    const isFirstQuestion = currentQuestionIndex === 0;

    // Previous
    $previousButton.prop("disabled", isFirstQuestion);
    $previousButton.toggleClass("btn-outline-secondary", isFirstQuestion)
    $previousButton.toggleClass("btn-outline-primary", !isFirstQuestion)


    // Next
    $nextButton.prop("disabled", currentQuestionIndex === lastQuestionIndex);

    // Once the user reaches the last question,
    // keep Submit visible for the rest of the quiz.
    if (currentQuestionIndex === lastQuestionIndex) {
      $submitContainer.removeClass("d-none");
    }
  }

  // =========================================================
  // Submit Quiz
  // =========================================================

  function submitQuiz() {
    if (!currentQuiz) {
      return;
    }

    const result = computeResult();

    // Don't submit if there are unanswered questions.
    if (unansweredQuestionsIndex.size > 0) {
      showUnansweredQuestionsModal();
      return;
    }

    displayResults(result);
  }

  // =========================================================
  // Compute Result
  // =========================================================

  function computeResult() {
    const questions = currentQuiz.questions;

    let correctCount = 0;
    let wrongCount = 0;

    questions.forEach((question, idx) => {
      const userAnswer = userAnswers[question.id];

      // Unanswered
      if (!userAnswer) {
        unansweredQuestionsIndex.add(idx);
        return;
      }

      // Find correct answer

      const correctOption = question.options.find(
        (option) => option.correct === true
      );

      if (!correctOption) {
        console.error(
          `Question ${question.id} does not have a correct option.`
        );

        return;
      }

      // Compare user's answer
      if (userAnswer === correctOption.id) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });


    const totalQuestions = questions.length;
    const answeredCount = correctCount + wrongCount;


    const percentage =
      totalQuestions === 0
        ? 0
        : Math.round((correctCount / totalQuestions) * 100);


    const result = {
      totalQuestions,
      answeredCount,
      correctCount,
      wrongCount,
      percentage
    };


    // console.log("Quiz result:", result);
    // console.log("Quiz unanswered:", unansweredQuestionsIndex)

    return result;
  }

  // =========================================================
  // Show Unanswered Questions Modal
  // =========================================================

  function showUnansweredQuestionsModal() {
    $unansweredQuestionList.empty();

    $unansweredModal.on("hidden.bs.modal", () => {
      $questionContainer.trigger("focus");
    });

    unansweredQuestionsIndex.forEach((idx) => {
      const questionNumber = idx + 1;

      const $link =
        $("<button>")
          .attr({
            type: "button",
            "data-question-index": idx
          })
          .addClass(
            "list-group-item " +
            "list-group-item-action"
          )
          .text(
            `Question ${questionNumber}`
          );


      $link.on("click", () => {
        currentQuestionIndex = idx;
        renderCurrentQuestion();
        $unansweredModal.modal("hide");
      });

      $unansweredQuestionList.append($link);
    });

    $unansweredModal.modal("show");

  }



  // =========================================================
  // Display Results
  // =========================================================

  function displayResults(result) {
    $resultSummary.empty();
    $resultDetails.empty();

    $quizArea.addClass("d-none");
    $resultsArea.removeClass("d-none");

    displayResultSummary(result);
    displayQuestionReview();
  }

  // =========================================================
  // Display Result Summary
  // =========================================================

  function displayResultSummary(result) {
    const $summary = $("<div>");

    const $score = $("<div>")
      .addClass("mb-3")
      .append(
        $("<h3>")
          .addClass("h4")
          .text(`Score: ${result.percentage}%`)
      );

    const $stats = $("<div>")
      .addClass("row g-2");

    const $correct = createResultStat(
      "Correct",
      result.correctCount,
      "text-success"
    );

    const $wrong = createResultStat(
      "Wrong",
      result.wrongCount,
      "text-danger"
    );

    $stats.append(
      $correct,
      $wrong,
    );

    $summary.append(
      $score,
      $stats
    );

    $resultSummary.append($summary);
  }

  // =========================================================
  // Create Result Stat
  // =========================================================
  function createResultStat(label, count, textClass) {
    return $("<div>")
      .addClass("col-md-6")
      .append(
        $("<div>")
          .addClass("card h-100")
          .append(
            $("<div>")
              .addClass("card-body text-center")
              .append(
                $("<div>")
                  .addClass(
                    `fs-3 fw-bold ${textClass}`
                  )
                  .text(count),
                $("<div>")
                  .addClass("text-muted")
                  .text(label)
              )
          )
      );
  }

  // =========================================================
  // Display Question Review
  // =========================================================

  function displayQuestionReview() {
    const questionReviews = currentQuiz.questions.map(buildQuestionReview);

    const correctAnswers = questionReviews.filter((questionReview) =>
      questionReview.status === "correct"
    );
    const wrongAnswers = questionReviews.filter((questionReview) =>
      questionReview.status === "wrong"
    );

    const $accordion = $("<div>")
      .addClass("accordion")
      .attr("id", "question-review-accordion");

    $accordion.append(
      createQuestionReviewSection(
        "correct",
        "Correct",
        correctAnswers,
        "success",
        false
      )
    );

    $accordion.append(
      createQuestionReviewSection(
        "wrong",
        "Wrong",
        wrongAnswers,
        "danger",
        true
      )
    );

    $resultDetails.append($accordion);
  }

  // =========================================================
  // Build Question Review
  // =========================================================


  function buildQuestionReview(question, idx) {
    const userAnswer = userAnswers[question.id];
    const correctOption = question.options.find(
      (option) => option.correct === true
    );

    const baseQuestionReview = {
      question,
      "questionIndex": idx,
      correctOption,
      userAnswer,
    }

    if (correctOption && userAnswer === correctOption.id) {
      return {
        ...baseQuestionReview,
        "status": "correct",
        "statusClass": "border-success",
        "statusText": "Correct",
      }
    }

    return {
      ...baseQuestionReview,
      "status": "wrong",
      "statusClass": "border-danger",
      "statusText": "Wrong",
    }
  }

  // =========================================================
  // Create Question Review Section
  // =========================================================

  function createQuestionReviewSection(
    sectionId,
    title,
    questionReviews,
    color,
    expanded
  ) {
    const headingId = `${sectionId}-heading`;
    const collapseId = `${sectionId}-collapse`;

    const $headerButton = $("<button>")
      .attr({
        type: "button",
        "data-bs-toggle": "collapse",
        "data-bs-target": `#${collapseId}`,
        "aria-expanded": expanded,
        "aria-controls": collapseId
      })
      .addClass(
        "accordion-button" +
        (expanded ? "" : " collapsed")
      )
      .append(
        $("<span>")
          .addClass(`text-${color} fw-bold`)
          .text(title),
        $("<span>")
          .addClass("ms-2 text-muted")
          .text(`(${questionReviews.length})`)
      );

    const $heading = $("<h2>")
      .attr("id", headingId)
      .addClass("accordion-header")
      .append($headerButton);

    const $body = $("<div>")
      .attr({
        id: collapseId,
        "aria-labelledby": headingId
      })
      .addClass(
        `accordion-collapse collapse${expanded ? " show" : ""}`
      );

    const $bodyContent = $("<div>")
      .addClass("accordion-body");

    questionReviews.forEach((questionReview) => {
      const $questionReviewCard =
        createQuestionReviewCard(questionReview);

      $bodyContent.append($questionReviewCard);
    });

    $body.append($bodyContent);

    return $("<div>")
      .addClass("accordion-item")
      .append(
        $heading,
        $body
      );
  }

  // =========================================================
  // Create Question Review Card
  // =========================================================

  function createQuestionReviewCard(questionReview) {
    const {
      statusClass,
      statusText,
      questionIndex,
      status,
      question,
      userAnswer,
      correctOption,
    } = questionReview;

    const $card = $("<div>")
      .addClass(`card mb-3 ${statusClass}`);

    const $header = $("<div>")
      .addClass("card-header d-flex justify-content-between")
      .append(
        $("<span>")
          .addClass("fw-bold")
          .text(`Question ${questionIndex + 1}`),
        $("<span>")
          .addClass(getStatusTextClass(status))
          .text(statusText)
      );

    const $body = $("<div>")
      .addClass("card-body");

    const $question = $("<p>")
      .addClass("fw-semibold")
      .text(question.question);

    $body.append($question);

    appendAnswerReview(
      $body,
      question,
      userAnswer,
      correctOption,
    );

    if (question.explanation && question.explanation !== "") {
      const $explanation = $("<div>")
        .addClass("alert alert-info mt-3 mb-0")
        .append(
          $("<strong>")
            .text("Explanation: "),
          document.createTextNode(
            question.explanation
          )
        );

      $body.append($explanation);
    }

    $card.append(
      $header,
      $body
    );

    return $card;
  }

  // =========================================================
  // Get Status Text Class
  // =========================================================

  function getStatusTextClass(status) {
    switch (status) {
      case "correct":
        return "text-success";

      case "wrong":
        return "text-danger";

      default:
        return "text-body";
    }
  }

  // =========================================================
  // Append Answer Review
  // =========================================================

  function appendAnswerReview(
    $container,
    question,
    userAnswer,
    correctOption
  ) {
    // Find user answer
    const userOption = question.options.find(
      (option) => option.id === userAnswer
    );

    // User's answer
    if (userOption) {
      const $userAnswer = $("<div>")
        .addClass("mb-2")
        .append(
          $("<strong>")
            .text("Your answer: "),
          document.createTextNode(
            userOption.text
          )
        );

      $container.append($userAnswer);
    }

    // Correct answer
    if (correctOption) {
      const $correctAnswer = $("<div>")
        .append(
          $("<strong>")
            .text("Correct answer: "),
          document.createTextNode(
            correctOption.text
          )
        );

      $container.append($correctAnswer);
    }
  }

  // =========================================================
  // Restart Quiz
  // =========================================================

  function restartQuiz() {
    if (!currentQuiz) {
      return;
    }

    // Reset quiz state
    currentQuestionIndex = 0;
    userAnswers = {}
    unansweredQuestionsIndex.clear();


    // Hide results
    $resultsArea.addClass("d-none");


    // Show quiz
    $quizArea.removeClass("d-none");

    // Hide submit button
    if (!$submitContainer.hasClass("d-none")) {
      $submitContainer.addClass("d-none");
    }

    // Render first question
    renderCurrentQuestion();

  }

  // =========================================================
  // Update Question Progress
  // =========================================================

  function updateQuestionProgress() {
    if (!currentQuiz) {
      return;
    }

    const totalQuestions = currentQuiz.questions.length;
    const answeredQuestions = Object.keys(userAnswers).length;
    const progress = Math.round((answeredQuestions / totalQuestions) * 100);

    $questionProgress.text(`${progress}%`);
    $quizProgressBar
      .css("width", `${progress}%`)
      .attr("aria-valuenow", progress);
  }


  // =========================================================
  // Status Messages
  // =========================================================

  function showLoading() {
    $loadStatus
      .removeAttr("hidden")
      .removeClass(
        "alert-success alert-danger alert-warning"
      )
      .addClass("alert alert-info")
      .text("Loading quiz...");
  }


  function showSuccess(message) {
    $loadStatus
      .removeAttr("hidden")
      .removeClass(
        "alert-info alert-danger alert-warning"
      )
      .addClass("alert alert-success")
      .text(message);

    setTimeout(() => {
      hideStatus();
    }, 1500);
  }


  function showError(message) {
    $loadStatus
      .removeAttr("hidden")
      .removeClass(
        "alert-info alert-success alert-warning"
      )
      .addClass("alert alert-danger")
      .text(message);
  }

  function hideStatus() {
    $loadStatus
      .attr("hidden", true)
      .text("");
  }


  // =========================================================
  // Util
  // =========================================================

  function isQuizLoaded() {
    const quizId = $quizSelect.find(":selected").data("quiz-id");

    if (currentQuiz && currentQuiz.quiz.id === quizId) {
      // console.log("Arealdy loaded");
      return true;
    }

    return false
  }

  function enableLoadButton(isEnabled) {
    $loadQuizButton.prop("disabled", !isEnabled);
  }
});