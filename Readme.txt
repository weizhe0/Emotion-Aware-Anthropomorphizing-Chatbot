EMOTION-AWARE ANTHROPOMORPHIZING CHATBOT
SOURCE CODE EXECUTION INSTRUCTIONS
============================================================

1. SOURCE CODE LINK
-------------------
Latest source code (Google Drive):

https://drive.google.com/drive/folders/1OBcaVBQorj5u7nspwwsbkfYfj2LD3unW?usp=sharing


2. PROJECT DESCRIPTION
----------------------
This project is an Emotion-Aware Anthropomorphizing Chatbot developed using
Python and Flask.

The system includes:
- User registration and login.
- Emotion-aware chatbot responses.
- Text sentiment analysis using:
  1. Multinomial Naive Bayes
  2. Logistic Regression
  3. DistilBERT
- Majority voting to determine the final text sentiment.
- MySQL database storage for users, chat sessions, messages, analytics, and
  weekly reports.
- Profile management and chat history.
- Weekly emotion and sentiment summaries.
- Groq API integration to generate chatbot replies.


3. RECOMMENDED SYSTEM REQUIREMENTS
----------------------------------
Operating System:
- Windows 10 or Windows 11, 64-bit

Recommended Hardware:
- At least 8 GB RAM
- At least 10 GB free storage
- Internet connection for Groq API access

Recommended Software:
- Python 3.10 or Python 3.11
- XAMPP with MySQL/MariaDB
- Google Chrome, Microsoft Edge, or Mozilla Firefox
- Visual Studio Code or another Python code editor


4. TOOL DOWNLOAD LINKS
----------------------
Python:
https://www.python.org/downloads/

XAMPP:
https://www.apachefriends.org/download.html

Visual Studio Code:
https://code.visualstudio.com/download

Groq API Console:
https://console.groq.com/keys


5. REQUIRED PROJECT FILES
-------------------------
Keep the original folder structure after downloading the project.

The main required files and folders include:

Emotion-Aware-Anthropomorphizing-Chatbot/
|
|-- app.py
|-- requirements.txt
|-- Readme.txt
|-- emotion_chatbot.sql                 (optional database backup)
|
|-- templates/
|   `-- required HTML files
|
|-- static/
|   |-- required CSS and JavaScript files
|   |-- required emotion model files, if applicable
|   `-- uploads/
|

Do not rename or move the templates, static, or saved_models
folders because the application uses their existing paths.


6. REQUIRED PYTHON LIBRARIES
----------------------------
The main Python libraries used by this project are:

- Flask
- Flask-SQLAlchemy
- Flask-Login
- Flask-Bcrypt
- PyMySQL
- Groq
- Joblib
- PyTorch
- Transformers
- Scikit-learn
- NumPy
- Werkzeug

The pip package name for PyTorch is:

torch

To generate a requirements.txt file containing the exact installed versions,
run this command on the original computer where the project works correctly:

python -m pip freeze > requirements.txt

Upload the generated requirements.txt together with the source code.


7. FIRST-TIME INSTALLATION
--------------------------

Step 1: Download the source code
1. Open the Google Drive link in Section 1.
2. Download the complete project folder.
3. Extract the ZIP file if necessary.
4. Keep all files and folders in their original locations.

Step 2: Install Python
1. Install Python 3.10 or Python 3.11.
2. During installation, select:

Add Python to PATH

3. Open Command Prompt and verify the installation:

python --version

Step 3: Open the project folder
Open Command Prompt inside the downloaded project folder.

Example:

cd "C:\Users\YourName\Downloads\Emotion-Aware-Anthropomorphizing-Chatbot"

Step 4: Create a virtual environment
Run:

python -m venv venv

Step 5: Activate the virtual environment
Run:

venv\Scripts\activate

After activation, "(venv)" should appear in Command Prompt.

Step 6: Upgrade pip
Run:

python -m pip install --upgrade pip

Step 7: Install the required libraries
The recommended method is:

python -m pip install -r requirements.txt

If requirements.txt is unavailable, run the following commands one by one:

python -m pip install Flask
python -m pip install Flask-SQLAlchemy
python -m pip install Flask-Login
python -m pip install Flask-Bcrypt
python -m pip install PyMySQL
python -m pip install groq
python -m pip install joblib
python -m pip install torch
python -m pip install transformers
python -m pip install scikit-learn
python -m pip install numpy
python -m pip install Werkzeug


8. GROQ API KEY SETUP
---------------------
The chatbot uses the Groq API to generate replies.

Step 1:
Open the Groq API Console:

https://console.groq.com/keys

Step 2:
Create or sign in to a Groq account.

Step 3:
Generate a new API key.

Step 4:
Open app.py and find:

GROQ_API_KEYS = [
    "",
    "",
]

Step 5:
Insert the API key between the quotation marks.

Example:

GROQ_API_KEYS = [
    "YOUR_GROQ_API_KEY"
]

Replace YOUR_GROQ_API_KEY with a valid Groq API key.

Important:
- Do not upload a real API key to Google Drive, GitHub, GitLab, or OneDrive.
- The submitted source code should contain an empty placeholder.
- The examiner should use their own Groq API key.
- Do not share API keys in screenshots or documentation.


9. MYSQL DATABASE SETUP
-----------------------
The application connects to a MySQL database named:

emotion_chatbot

This database must be created once before running the application for the first
time.

Step 1: Open XAMPP
1. Open XAMPP Control Panel.
2. Start Apache.
3. Start MySQL.
4. Confirm that both services show a running status.

Step 2: Open phpMyAdmin
Open:

http://localhost/phpmyadmin

Step 3: Create the database
1. Click "New".
2. Enter the database name:

emotion_chatbot

3. Click "Create".

The application automatically creates the required tables when app.py starts.

Optional SQL import:
The provided emotion_chatbot.sql file is a database backup containing the table
structure and sample records. It is not required for a clean installation.

To import it:
1. Create and select the emotion_chatbot database.
2. Click "Import".
3. Select emotion_chatbot.sql.
4. Click "Go".

Important:
The provided SQL file does not create the database automatically. The
emotion_chatbot database must be created before importing the file.

The default database connection in app.py is:

mysql+pymysql://root:@localhost/emotion_chatbot

This means:
- Username: root
- Password: empty
- Host: localhost
- Database: emotion_chatbot

If the MySQL root account has a password, update this line in app.py.

Example:

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:YOUR_PASSWORD@localhost/emotion_chatbot'

Replace YOUR_PASSWORD with the actual MySQL password.


10. TRAINED SENTIMENT MODEL SETUP
---------------------------------
Before running the application, confirm that the following files exist:

train_sentiment/saved_models/tfidf_vectorizer.pkl
train_sentiment/saved_models/naive_bayes.pkl
train_sentiment/saved_models/logistic_regression.pkl
train_sentiment/saved_models/distilbert/

The distilbert folder must include the required model, tokenizer, and
configuration files.

The application loads these files when app.py starts. If a required file is
missing, the application will show a file-not-found error.


11. EMOTION DATASET INSTRUCTIONS
--------------------------------
The emotion datasets are not required for normal execution of the final
application. They are only required when retraining the facial emotion
recognition component.

This project uses the following public facial emotion datasets:

1. RAF-DB Dataset

https://www.kaggle.com/datasets/shuvoalok/raf-db-dataset

2. FER-2013 Dataset

https://www.kaggle.com/datasets/msambare/fer2013

Download instructions:
1. Open the required Kaggle dataset link.
2. Sign in to a Kaggle account.
3. Click "Download".
4. Extract the downloaded ZIP file.
5. Place the extracted dataset in the folder expected by the corresponding
   emotion model training script.
6. Update the dataset path in the training script if the folder name or
   location is different.
7. Run the corresponding training script only when model retraining is needed.

Important:
- RAF-DB and FER-2013 are public facial emotion recognition datasets.
- The datasets are not required for registration, login, or normal chatbot use.
- Dataset retraining is outside the normal execution steps of the submitted
  application.


12. HOW TO RUN THE APPLICATION
------------------------------
Complete Sections 7, 8, and 9 before running the application for the first time.

Every time the application is used, follow these steps:

Step 1: Start XAMPP
1. Open XAMPP Control Panel.
2. Start Apache.
3. Start MySQL.

MySQL must be running before registration or login because user accounts and
chat records are stored in the database.

Step 2: Open the project folder
Open Command Prompt inside the project folder.

Example:

cd "C:\Users\YourName\Downloads\Emotion-Aware-Anthropomorphizing-Chatbot"

Step 3: Activate the virtual environment
Run:

venv\Scripts\activate

Step 4: Run the application
Run:

python app.py

Step 5: Open the application
The application should automatically open in the web browser.

If it does not open automatically, open:

http://127.0.0.1:5000/

Step 6: Register or log in
1. Register a new account if this is the first time using the application.
2. Log in using the registered email address and password.
3. Start a new chat.
4. Allow camera permission if the facial emotion recognition feature requires
   access to the webcam.


13. EXPECTED OUTPUT
-------------------
After the program starts successfully, Command Prompt should show messages
similar to:

- All sentiment models loaded
- All database tables ready
- Groq model information
- Sentiment models: Naive Bayes, Logistic Regression, and DistilBERT
- Storage: MySQL via XAMPP
- Flask server running at http://127.0.0.1:5000/


14. COMMON ERRORS AND SOLUTIONS
-------------------------------

Error: "python is not recognized"

Solution:
Reinstall Python and select "Add Python to PATH" during installation.


Error: "ModuleNotFoundError"

Solution:
Activate the virtual environment and run:

python -m pip install -r requirements.txt


Error: MySQL connection refused

Solution:
Open XAMPP Control Panel and start MySQL.


Error: Unknown database 'emotion_chatbot'

Solution:
Open phpMyAdmin and create a database named emotion_chatbot.


Error: Access denied for user 'root'

Solution:
Check the MySQL username and password in the SQLALCHEMY_DATABASE_URI setting in
app.py.


Error: Model file not found

Solution:
Confirm that all trained sentiment model files are inside:

train_sentiment/saved_models/


Error: Groq API authentication failed

Solution:
Insert a valid Groq API key and confirm that the computer has internet access.


Error: Port 5000 is already in use

Solution:
Close the other program using port 5000 or change the final line in app.py to
another port.

Example:

app.run(debug=True, use_reloader=False, port=5001)

Then open:

http://127.0.0.1:5001/


15. SHUTTING DOWN THE APPLICATION
---------------------------------
To stop the application:

1. Return to Command Prompt.
2. Press:

Ctrl + C

3. Stop Apache and MySQL in XAMPP if they are no longer required.
4. Deactivate the virtual environment:

deactivate


16. IMPORTANT SUBMISSION CHECKLIST
----------------------------------
Before submitting, confirm that:

[ ] The Google Drive link opens without requesting access.
[ ] The Google Drive permission is "Anyone with the link - Viewer".
[ ] The link will remain valid for at least one year.
[ ] app.py is included and is named correctly.
[ ] All templates and static files are included.
[ ] All trained sentiment model files are included.
[ ] Readme.txt is included.
[ ] requirements.txt contains the required libraries and versions.
[ ] emotion_chatbot.sql is included if it is part of the submission.
[ ] Real API keys have been removed.
[ ] The RAF-DB and FER-2013 dataset links are included.
[ ] The application has been tested after downloading it into a new folder.
[ ] The emotion_chatbot database setup instructions are correct.
[ ] The program runs successfully using the instructions in this file.


17. PROJECT DEVELOPER
---------------------
Name: Tai Wei Zhe
Project Title: Emotion-Aware Anthropomorphizing Chatbot
Programme: Bachelor of Computer Science (Honours) (Artificial Intelligence)

Last updated:
17 July 2026


END OF README
============================================================
