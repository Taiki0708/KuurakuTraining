(function () {
  'use strict';
  const dictionaries = {
    ja: {
      'Back to training':'研修画面へ戻る','Administrator workspace':'管理者ワークスペース','Training dashboard':'研修ダッシュボード','See who needs support, assign training, and manage learning content from one place.':'サポートが必要なスタッフの確認、研修の割り当て、教材管理を1か所で行えます。','Open V1 practical checks':'V1 実技確認を開く','Overview':'概要','Assignments':'割り当て','Learning content':'教材管理','Team & updates':'チーム・お知らせ','Learners':'スタッフ','Active in reports':'レポート対象','Completed courses':'修了コース','Recorded completions':'記録済みの修了','Average score':'平均点','Across completions':'修了結果の平均','Overdue':'期限超過','Needs attention now':'今すぐ確認が必要','Due within 7 days':'7日以内が期限','Upcoming deadlines':'まもなく期限','Uncompleted':'未完了','Open assignments':'未完了の割り当て','Priority':'優先対応','Follow-up needed':'フォローが必要','View all assignments':'すべての割り当てを見る','Learner':'スタッフ','Course':'コース','Due date':'期限','Follow-up':'フォロー','No follow-up needed. Your team is on track.':'フォローが必要な項目はありません。順調に進んでいます。','Results':'結果','Completed training':'修了した研修','Search learner results and export the current view.':'スタッフの結果を検索し、表示中の内容を出力できます。','Download CSV':'CSVをダウンロード','All courses':'すべてのコース','Score':'スコア','Completed':'修了日','No completed courses match these filters.':'条件に一致する修了結果はありません。','Assign':'割り当て','Assign training':'研修を割り当てる','Choose a learner, course, and optional due date.':'スタッフ、コース、必要に応じて期限を選択してください。','Customer Service':'接客サービス','Food Safety':'食品衛生','Japanese Hospitality':'日本のおもてなし','Restaurant Basics':'飲食店の基本','Assign course':'コースを割り当てる','Schedule':'スケジュール','All assignments':'すべての割り当て','Assigned course':'割り当てコース','Status':'状態','No assigned courses yet.':'割り当てられたコースはまだありません。','Courses':'コース','Course settings':'コース設定','Edit the title, description, display order, and publishing status.':'タイトル、説明、表示順、公開状態を編集できます。','Title':'タイトル','Display order':'表示順','Description':'説明','Published for learners':'スタッフに公開する','Save course settings':'コース設定を保存','Question bank':'問題バンク','Question settings':'問題設定','Create, edit, reorder, or delete quiz questions.':'クイズ問題の作成、編集、並べ替え、削除ができます。','+ New question':'+ 新しい問題','Language':'言語','Question':'問題','Question text':'問題文','Answer 1':'回答 1','Answer 2':'回答 2','Answer 3':'回答 3','Answer 4':'回答 4','Optional':'任意','Correct answer':'正解','Explanation':'解説','Save question':'問題を保存','Delete question':'問題を削除','Organization':'組織','Group management':'グループ管理','Create teams and assign a course to everyone in a group.':'チームを作成し、グループ全員にコースを割り当てます。','Group name':'グループ名','Create group':'グループを作成','Group':'グループ','Add learner':'スタッフを追加','Assign to group':'グループに割り当て','Communication':'連絡','Announcement':'お知らせ','Share a short update with learners.':'スタッフへ短いお知らせを共有します。','Message':'メッセージ','Show to learners':'スタッフに表示する','Publish announcement':'お知らせを公開','Checking access…':'アクセス権を確認しています…','Manager workspace':'店長ワークスペース','Staff progress & practical checks':'スタッフ進捗・実技確認','Review results by name, find unfinished training, and record practical skills after a passing quiz.':'名前で結果を確認し、未完了の研修を探し、クイズ合格後の実技を記録できます。','Training':'研修','Admin overview':'管理概要','Staff progress':'スタッフ進捗','Staff':'スタッフ','Name or email':'名前またはメール','Store':'店舗','Role':'役割','All stores':'すべての店舗','All roles':'すべての役割','All':'すべて','Incomplete':'未完了','Quiz passed':'クイズ合格','Practical complete':'実技完了','Latest':'最新','Best':'最高','Attempts':'受験回数','Last learning':'最終学習日','Quiz':'クイズ','Practical':'実技','Certificate':'修了証','Practical check':'実技確認','Only staff who passed the quiz can be assessed. Manager approval is saved with your account and time.':'クイズに合格したスタッフのみ確認できます。確認者と確認日時が保存されます。','Course test settings':'コース試験設定','Platform administrators can configure test size, passing score and certificate requirement. Existing certificates are not removed.':'プラットフォーム管理者は出題数、合格点、修了証の条件を設定できます。既存の修了証は削除されません。','Questions per test':'1回の出題数','Passing score (%)':'合格点（%）','Certificate condition':'修了証の条件','Quiz only':'クイズのみ','Quiz + practical':'クイズ＋実技','Save settings':'設定を保存','Passed':'合格','Not passed':'未合格','Issued':'発行済み','Not issued':'未発行','Not checked':'未確認','Practicing':'練習中','Can perform independently':'一人でできる','Needs review':'再確認が必要','Comment':'コメント','Save check':'確認を保存','Quiz not passed yet. Practical assessment is available after a passing quiz.':'まだクイズに合格していません。合格後に実技確認ができます。','No matching staff or courses.':'条件に一致するスタッフまたはコースはありません。','Saving…':'保存しています…','Practical check saved.':'実技確認を保存しました。','Settings saved.':'設定を保存しました。','Manager sign-in is required.':'店長アカウントでのログインが必要です。','Sign in with an administrator account to view this page.':'管理者アカウントでログインしてください。','You do not have permission to view this page.':'このページを表示する権限がありません。','The report could not be loaded. Please try again.':'レポートを読み込めませんでした。もう一度お試しください。','Saving course settings…':'コース設定を保存しています…','Course settings saved.':'コース設定を保存しました。','The course settings could not be saved.':'コース設定を保存できませんでした。','Loading questions…':'問題を読み込んでいます…','No saved questions yet. Create the first one.':'保存された問題はありません。最初の問題を作成してください。','The questions could not be loaded.':'問題を読み込めませんでした。','Please provide at least two answers.':'回答を2つ以上入力してください。','Saving question…':'問題を保存しています…','Question saved.':'問題を保存しました。','The question could not be saved.':'問題を保存できませんでした。','Deleting question…':'問題を削除しています…','Question deleted.':'問題を削除しました。','The question could not be deleted.':'問題を削除できませんでした。','Saving assignment…':'割り当てを保存しています…','Course assigned.':'コースを割り当てました。','The assignment could not be saved.':'割り当てを保存できませんでした。','Due soon':'期限間近','No deadline':'期限なし','On schedule':'予定どおり','Create a group first.':'先にグループを作成してください。','No members yet.':'メンバーはまだいません。','Group created.':'グループを作成しました。','Learner added.':'スタッフを追加しました。','Announcement saved.':'お知らせを保存しました。','Could not save announcement.':'お知らせを保存できませんでした。','Answer':'回答','result':'件','results':'件','question(s) loaded.':'件の問題を読み込みました。','learner(s) assigned.':'人のスタッフに割り当てました。','Checked':'確認日時','by':'確認者','Could not save:':'保存できませんでした：'
    },
    hi: {
      'Back to training':'प्रशिक्षण पर वापस जाएँ','Administrator workspace':'एडमिन कार्यक्षेत्र','Training dashboard':'प्रशिक्षण डैशबोर्ड','See who needs support, assign training, and manage learning content from one place.':'किसे सहायता चाहिए देखें, प्रशिक्षण सौंपें और सामग्री एक ही स्थान पर प्रबंधित करें।','Open V1 practical checks':'V1 व्यावहारिक जाँच खोलें','Overview':'सारांश','Assignments':'असाइनमेंट','Learning content':'प्रशिक्षण सामग्री','Team & updates':'टीम और अपडेट','Learners':'कर्मचारी','Active in reports':'रिपोर्ट में कर्मचारी','Completed courses':'पूरे किए कोर्स','Recorded completions':'दर्ज पूर्णताएँ','Average score':'औसत स्कोर','Across completions':'पूर्ण परिणामों का औसत','Overdue':'समय सीमा पार','Needs attention now':'तुरंत ध्यान दें','Due within 7 days':'7 दिनों में देय','Upcoming deadlines':'आने वाली समय सीमाएँ','Uncompleted':'अधूरा','Open assignments':'खुले असाइनमेंट','Priority':'प्राथमिकता','Follow-up needed':'फ़ॉलो-अप आवश्यक','View all assignments':'सभी असाइनमेंट देखें','Learner':'कर्मचारी','Course':'कोर्स','Due date':'अंतिम तिथि','Follow-up':'फ़ॉलो-अप','No follow-up needed. Your team is on track.':'किसी फ़ॉलो-अप की आवश्यकता नहीं है। टीम सही दिशा में है।','Results':'परिणाम','Completed training':'पूरा प्रशिक्षण','Search learner results and export the current view.':'कर्मचारी परिणाम खोजें और वर्तमान दृश्य निर्यात करें।','Download CSV':'CSV डाउनलोड करें','All courses':'सभी कोर्स','Score':'स्कोर','Completed':'पूरा हुआ','No completed courses match these filters.':'इन फ़िल्टर से कोई पूरा कोर्स नहीं मिला।','Assign':'सौंपें','Assign training':'प्रशिक्षण सौंपें','Choose a learner, course, and optional due date.':'कर्मचारी, कोर्स और वैकल्पिक अंतिम तिथि चुनें।','Customer Service':'ग्राहक सेवा','Food Safety':'खाद्य सुरक्षा','Japanese Hospitality':'जापानी आतिथ्य','Restaurant Basics':'रेस्तराँ की मूल बातें','Assign course':'कोर्स सौंपें','Schedule':'समय-सारणी','All assignments':'सभी असाइनमेंट','Assigned course':'सौंपा गया कोर्स','Status':'स्थिति','No assigned courses yet.':'अभी कोई कोर्स नहीं सौंपा गया है।','Courses':'कोर्स','Course settings':'कोर्स सेटिंग','Edit the title, description, display order, and publishing status.':'शीर्षक, विवरण, क्रम और प्रकाशन स्थिति बदलें।','Title':'शीर्षक','Display order':'प्रदर्शन क्रम','Description':'विवरण','Published for learners':'कर्मचारियों को दिखाएँ','Save course settings':'कोर्स सेटिंग सहेजें','Question bank':'प्रश्न बैंक','Question settings':'प्रश्न सेटिंग','Create, edit, reorder, or delete quiz questions.':'क्विज़ प्रश्न बनाएँ, संपादित करें, क्रम बदलें या हटाएँ।','+ New question':'+ नया प्रश्न','Language':'भाषा','Question':'प्रश्न','Question text':'प्रश्न पाठ','Answer 1':'उत्तर 1','Answer 2':'उत्तर 2','Answer 3':'उत्तर 3','Answer 4':'उत्तर 4','Optional':'वैकल्पिक','Correct answer':'सही उत्तर','Explanation':'व्याख्या','Save question':'प्रश्न सहेजें','Delete question':'प्रश्न हटाएँ','Organization':'संगठन','Group management':'समूह प्रबंधन','Create teams and assign a course to everyone in a group.':'टीम बनाएँ और समूह के सभी लोगों को कोर्स सौंपें।','Group name':'समूह का नाम','Create group':'समूह बनाएँ','Group':'समूह','Add learner':'कर्मचारी जोड़ें','Assign to group':'समूह को सौंपें','Communication':'संचार','Announcement':'घोषणा','Share a short update with learners.':'कर्मचारियों के साथ छोटा अपडेट साझा करें।','Message':'संदेश','Show to learners':'कर्मचारियों को दिखाएँ','Publish announcement':'घोषणा प्रकाशित करें','Checking access…':'पहुँच जाँची जा रही है…','Manager workspace':'मैनेजर कार्यक्षेत्र','Staff progress & practical checks':'कर्मचारी प्रगति और व्यावहारिक जाँच','Review results by name, find unfinished training, and record practical skills after a passing quiz.':'नाम से परिणाम देखें, अधूरा प्रशिक्षण खोजें और क्विज़ पास होने के बाद व्यावहारिक कौशल दर्ज करें।','Training':'प्रशिक्षण','Admin overview':'एडमिन सारांश','Staff progress':'कर्मचारी प्रगति','Staff':'कर्मचारी','Name or email':'नाम या ईमेल','Store':'स्टोर','Role':'भूमिका','All stores':'सभी स्टोर','All roles':'सभी भूमिकाएँ','All':'सभी','Incomplete':'अधूरा','Quiz passed':'क्विज़ पास','Practical complete':'व्यावहारिक पूरा','Latest':'नवीनतम','Best':'सर्वश्रेष्ठ','Attempts':'प्रयास','Last learning':'अंतिम अध्ययन','Quiz':'क्विज़','Practical':'व्यावहारिक','Certificate':'प्रमाणपत्र','Practical check':'व्यावहारिक जाँच','Only staff who passed the quiz can be assessed. Manager approval is saved with your account and time.':'केवल क्विज़ पास कर्मचारी की जाँच की जा सकती है। जाँचकर्ता और समय सहेजे जाते हैं।','Course test settings':'कोर्स परीक्षा सेटिंग','Platform administrators can configure test size, passing score and certificate requirement. Existing certificates are not removed.':'प्लेटफ़ॉर्म एडमिन प्रश्न संख्या, पास स्कोर और प्रमाणपत्र की शर्त सेट कर सकते हैं। मौजूदा प्रमाणपत्र नहीं हटेंगे।','Questions per test':'प्रति परीक्षा प्रश्न','Passing score (%)':'पास स्कोर (%)','Certificate condition':'प्रमाणपत्र की शर्त','Quiz only':'केवल क्विज़','Quiz + practical':'क्विज़ + व्यावहारिक','Save settings':'सेटिंग सहेजें','Passed':'पास','Not passed':'पास नहीं','Issued':'जारी','Not issued':'जारी नहीं','Not checked':'जाँच नहीं हुई','Practicing':'अभ्यास जारी','Can perform independently':'स्वतंत्र रूप से कर सकता है','Needs review':'फिर जाँच आवश्यक','Comment':'टिप्पणी','Save check':'जाँच सहेजें','Quiz not passed yet. Practical assessment is available after a passing quiz.':'क्विज़ अभी पास नहीं हुआ। पास होने के बाद व्यावहारिक जाँच उपलब्ध होगी।','No matching staff or courses.':'कोई मेल खाता कर्मचारी या कोर्स नहीं मिला।','Saving…':'सहेजा जा रहा है…','Practical check saved.':'व्यावहारिक जाँच सहेजी गई।','Settings saved.':'सेटिंग सहेजी गई।','Manager sign-in is required.':'मैनेजर साइन-इन आवश्यक है।','Sign in with an administrator account to view this page.':'यह पेज देखने के लिए एडमिन खाते से साइन इन करें।','You do not have permission to view this page.':'आपको यह पेज देखने की अनुमति नहीं है।','The report could not be loaded. Please try again.':'रिपोर्ट लोड नहीं हुई। फिर प्रयास करें।','Saving course settings…':'कोर्स सेटिंग सहेजी जा रही है…','Course settings saved.':'कोर्स सेटिंग सहेजी गई।','The course settings could not be saved.':'कोर्स सेटिंग सहेजी नहीं जा सकी।','Loading questions…':'प्रश्न लोड हो रहे हैं…','No saved questions yet. Create the first one.':'अभी कोई प्रश्न सहेजा नहीं गया है। पहला प्रश्न बनाएँ।','The questions could not be loaded.':'प्रश्न लोड नहीं हो सके।','Please provide at least two answers.':'कम से कम दो उत्तर दें।','Saving question…':'प्रश्न सहेजा जा रहा है…','Question saved.':'प्रश्न सहेजा गया।','The question could not be saved.':'प्रश्न सहेजा नहीं जा सका।','Deleting question…':'प्रश्न हटाया जा रहा है…','Question deleted.':'प्रश्न हटा दिया गया।','The question could not be deleted.':'प्रश्न हटाया नहीं जा सका।','Saving assignment…':'असाइनमेंट सहेजा जा रहा है…','Course assigned.':'कोर्स सौंपा गया।','The assignment could not be saved.':'असाइनमेंट सहेजा नहीं जा सका।','Due soon':'जल्द देय','No deadline':'कोई समय सीमा नहीं','On schedule':'समय पर','Create a group first.':'पहले समूह बनाएँ।','No members yet.':'अभी कोई सदस्य नहीं।','Group created.':'समूह बनाया गया।','Learner added.':'कर्मचारी जोड़ा गया।','Announcement saved.':'घोषणा सहेजी गई।','Could not save announcement.':'घोषणा सहेजी नहीं जा सकी।','Answer':'उत्तर','result':'परिणाम','results':'परिणाम','question(s) loaded.':'प्रश्न लोड हुए।','learner(s) assigned.':'कर्मचारियों को सौंपा गया।','Checked':'जाँच','by':'द्वारा','Could not save:':'सहेजा नहीं जा सका:'
    }
  };

  Object.assign(dictionaries.ja, {
    'Search by name or email':'名前またはメールで検索',
    'Administrator sections':'管理者メニュー',
    'Training summary':'研修概要',
    'Delete this question? This cannot be undone.':'この問題を削除しますか？この操作は元に戻せません。',
    'Could not load group management.':'グループ管理を読み込めませんでした。',
    'Could not load learner display names.':'スタッフの表示名を読み込めませんでした。'
  });
  Object.assign(dictionaries.hi, {
    'Search by name or email':'नाम या ईमेल से खोजें',
    'Administrator sections':'एडमिन अनुभाग',
    'Training summary':'प्रशिक्षण सारांश',
    'Delete this question? This cannot be undone.':'क्या यह प्रश्न हटाना है? इसे वापस नहीं किया जा सकता।',
    'Could not load group management.':'समूह प्रबंधन लोड नहीं हो सका।',
    'Could not load learner display names.':'कर्मचारियों के प्रदर्शन नाम लोड नहीं हो सके।'
  });

  const language = localStorage.getItem('serveupLanguage') || 'en';
  const originalText = new WeakMap();
  const dictionary = dictionaries[language] || {};

  function interpolate(value, variables) {
    return Object.entries(variables || {}).reduce((text, entry) => text.replaceAll(`{${entry[0]}}`, String(entry[1])), value);
  }

  function translatePattern(value) {
    let match = value.match(/^(\d+) results?$/);
    if (match) return language === 'ja' ? `${match[1]}件` : language === 'hi' ? `${match[1]} परिणाम` : value;
    match = value.match(/^(\d+) question\(s\) loaded\.$/);
    if (match) return language === 'ja' ? `${match[1]}件の問題を読み込みました。` : language === 'hi' ? `${match[1]} प्रश्न लोड हुए।` : value;
    match = value.match(/^(\d+) learner\(s\) assigned\.$/);
    if (match) return language === 'ja' ? `${match[1]}人のスタッフに割り当てました。` : language === 'hi' ? `${match[1]} कर्मचारियों को सौंपा गया।` : value;
    if (value.startsWith('Could not save: ')) return `${dictionary['Could not save:'] || 'Could not save:'} ${value.slice(16)}`;
    if (value.startsWith('Members: ')) {
      if (language === 'ja') return `メンバー：${value.slice(9)}`;
      if (language === 'hi') return `सदस्य: ${value.slice(9)}`;
    }
    if (value.startsWith('Manager V1 data unavailable: ')) {
      const detail = value.slice(29).replace('. Apply the reviewed V1 database migration before using practical approval.', '');
      if (language === 'ja') return `V1管理データを読み込めません：${detail}。確認済みのV1データベース移行を適用してください。`;
      if (language === 'hi') return `V1 मैनेजर डेटा उपलब्ध नहीं है: ${detail}।व्यावहारिक अनुमोदन से पहले जाँचा हुआ V1 डेटाबेस माइग्रेशन लागू करें।`;
    }
    if (value.startsWith('Checked ') && value.includes(' by ')) {
      const parts = value.slice(8).split(' by ');
      if (language === 'ja') return `確認日時 ${parts[0]}・確認者 ${parts.slice(1).join(' by ')}`;
      if (language === 'hi') return `जाँच ${parts[0]} · ${parts.slice(1).join(' by ')} द्वारा`;
    }
    return dictionary[value] || value;
  }

  function t(value, variables) {
    return interpolate(translatePattern(value), variables);
  }

  function translateTextNode(node) {
    if (!originalText.has(node)) originalText.set(node, node.nodeValue);
    const original = originalText.get(node);
    const trimmed = original.trim();
    if (!trimmed) return;
    const translated = t(trimmed);
    node.nodeValue = original.replace(trimmed, translated);
  }

  function apply(root) {
    if (language === 'en') return;
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) translateTextNode(walker.currentNode);
    (root || document).querySelectorAll?.('input[placeholder], textarea[placeholder]').forEach(input => {
      if (!input.dataset.originalPlaceholder) input.dataset.originalPlaceholder = input.placeholder;
      input.placeholder = t(input.dataset.originalPlaceholder);
    });
    (root || document).querySelectorAll?.('[aria-label]').forEach(element => {
      if (!element.dataset.originalAriaLabel) element.dataset.originalAriaLabel = element.getAttribute('aria-label');
      element.setAttribute('aria-label', t(element.dataset.originalAriaLabel));
    });
  }

  function setupSelector() {
    const select = document.getElementById('adminLanguageSelect');
    if (!select) return;
    select.value = language;
    select.addEventListener('change', () => {
      localStorage.setItem('serveupLanguage', select.value);
      window.location.reload();
    });
  }

  document.documentElement.lang = language;
  setupSelector();
  apply(document.body);
  if (language !== 'en') {
    const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
      else if (node.nodeType === Node.ELEMENT_NODE) apply(node);
    })));
    observer.observe(document.body, { childList:true, subtree:true });
  }
  window.ServeUpAdminI18n = { language, t, apply };
}());
