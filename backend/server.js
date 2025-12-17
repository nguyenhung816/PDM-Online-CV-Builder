const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Trieuhung@2k6', 
    database: 'cv_builder_db'
});

db.connect(err => {
    if (err) { console.error('DB Connection Error: ' + err.stack); return; }
    console.log('Connected to MySQL database.');
});

// API ROUTE
app.get('/api/profile/:userId', (req, res) => {
    const userId = req.params.userId;
    const userQuery = "SELECT FullName, Email, SubscriptionType, ProfilePicture FROM User WHERE UserID = ?";
    const cvQuery = "SELECT CVID, Title, LastUpdated, Language FROM CV WHERE UserID = ?";

    db.query(userQuery, [userId], (err, userResults) => {
        if (err) return res.status(500).send(err);
        if (userResults.length === 0) return res.status(404).send('User not found');

        db.query(cvQuery, [userId], (err, cvResults) => {
            if (err) return res.status(500).send(err);
            res.json({ user: userResults[0], cvs: cvResults });
        });
    });
});
app.post('/api/create-cv', (req, res) => {
    const { userId, title, templateId } = req.body;

    // Default values for a new CV
    const sql = `INSERT INTO CV (UserID, TemplateID, Title, Language) VALUES (?, ?, ?, 'English')`;

    db.query(sql, [userId, templateId, title], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error creating CV');
        }
        res.json({ message: 'CV Created!', cvId: result.insertId });
    });
});
// DELETE ROUTE: Delete a CV
app.delete('/api/delete-cv/:cvId', (req, res) => {
    const cvId = req.params.cvId;
    const sql = "DELETE FROM CV WHERE CVID = ?";

    db.query(sql, [cvId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error deleting CV');
        }
        res.json({ message: 'CV deleted successfully' });
    });
});
// NEW ROUTE: Update Profile Info (Name & Email)
app.put('/api/update-profile', (req, res) => {
    const { userId, fullName, email } = req.body;

    const sql = "UPDATE User SET FullName = ?, Email = ? WHERE UserID = ?";

    db.query(sql, [fullName, email, userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error updating profile');
        }
        res.json({ message: 'Profile updated successfully' });
    });
});

// Login API
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM user WHERE Email = ?";
    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0) return res.status(401).json({ error: "Invalid email or password" });

        const user = results[0];

        // Compare password
        if (password === user.PasswordHash) {
            return res.json({ 
                message: "Login successful",
                userID: user.UserID,
                fullName: user.FullName,
                subscription: user.SubscriptionType
            });
        } else {
            return res.status(401).json({ error: "Invalid email or password" });
        }
    });
});

// Save CV API
app.post("/api/save-cv", (req, res) => {
    const data = req.body;

    const {
        userId,
        Title,
        TemplateID,
        CV_FullName,
        CV_Email,
        CV_PhoneNumber,
        CV_Address,
        CV_LinkedInURL,
        Education,
        EduDescriptions,
        WorkExperience,
        Skills,
        Projects,
        Certifications
    } = data;

    // Insert main CV entry
    const sqlCV = `
        INSERT INTO cv (UserID, Title, TemplateID, CV_FullName, CV_Email, CV_PhoneNumber, CV_Address, CV_LinkedInURL)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sqlCV, [userId, Title, TemplateID, CV_FullName, CV_Email, CV_PhoneNumber, CV_Address, CV_LinkedInURL], 
        (err, result) => {
            if (err) return res.json({ error: err });

            const CVID = result.insertId;

            // Insert Education
            const sqlEdu = `
                INSERT INTO education (CVID, SchoolName, Degree, FieldOfStudy, Location, StartDate, EndDate, Description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            if (Education && Array.isArray(Education)) {
                Education.forEach((e) =>{
                    db.query(sqlEdu, [
                        CVID,
                        e.SchoolName,
                        e.Degree,
                        e.FieldOfStudy,
                        e.Location,
                        e.Start,
                        e.End,
                        EduDescriptions
                    ], (err) => {
                        if (err) console.log("EDU ERROR:", err);
                    });
                });
            }

            // Insert Work Experience
            const sqlWork = `
                INSERT INTO work_experience (CVID, JobTitle, CompanyName, Location, StartDate, EndDate, Description)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            WorkExperience.forEach((w) => {
                db.query(sqlWork, [
                    CVID,
                    w.JobTitle,
                    w.CompanyName,
                    w.Location,
                    w.Start,
                    w.End,
                    w.Description
                ],(err) => {
                    if (err) console.log("WORK ERROR:", err);
                });
            });

            // Insert Skills
            const sqlSkill = `
                INSERT INTO skill (CVID, SkillName, ProficiencyLevel, Category)
                VALUES (?, ?, ?, ?)
            `;
            Skills.forEach((s) => {
                db.query(sqlSkill, [
                    CVID,
                    s.SkillName,
                    s.ProficiencyLevel,
                    s.Category
                ],(err) => {
                    if (err) console.log("SKILLS ERROR:", err);
                });
            });

            // Insert Projects
            const sqlProject = `
                INSERT INTO project (CVID, ProjectName, Description, ProjectURL)
                VALUES (?, ?, ?, ?)
            `;
            Projects.forEach((p) => {
                db.query(sqlProject, [
                    CVID,
                    p.ProjectName,
                    p.Description,
                    p.ProjectURL
                ],(err) => {
                    if (err) console.log("PROJECTS ERROR:", err);
                });
            });


            // Insert Certifications
            const sqlCertification = `
                INSERT INTO certification (CVID, CertificationName, IssuingOrganization, IssueDate, ExpirationDate, CredentialID, CredentialURL)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            Certifications.forEach((c) => {
                db.query(sqlCertification, [
                    CVID,
                    c.CertificationName,
                    c.IssuingOrganization,
                    c.IssueDate,
                    c.ExpirationDate,
                    c.CredentialID,
                    c.CredentialURL
                ],(err) => {
                    if (err) console.log("CERTIFICATIONS ERROR:", err);
                });
            });

            return res.json({ message: "CV Saved Successfully!", cvId: CVID });
        }
    );
});



app.listen(3000, () => {
    console.log('Server running on port 3000');
});
