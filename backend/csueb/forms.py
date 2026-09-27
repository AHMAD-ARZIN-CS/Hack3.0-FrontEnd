from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, TextAreaField, EmailField, SelectField
from wtforms.validators import DataRequired, Email, ValidationError, Length

categories = [('Study Help', 'Study Help'), ('Roommate Request', 'Roommate Request'), ('Safety', 'Safety'), ('Food Assistance', 'Food Assistance'), ('Financial Assistance', 'Financial Assistance')]

def validate_email(form, field):
    allowed_extensions = ('csueastbay.edu')
    if not field.data.endswith(allowed_extensions):
        raise ValidationError(message='Email address must be a valid CSUEB email')

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=5, max=20)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=5, max=20)])
    submit = SubmitField('Sign In')

class RegisterForm(FlaskForm):
    firstname = StringField('First Name', validators=[DataRequired(), Length(min=2, max=25)])
    lastname = StringField('Last Name', validators=[DataRequired(), Length(min=2, max=25)])
    username = StringField('Username', validators=[DataRequired(), Length(min=5, max=20)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=5, max=20)])
    email = EmailField('Email', validators=[DataRequired(), Email(), validate_email, Length(min=5, max=100)])
    submit = SubmitField('Register')

class PostForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired()])
    body = TextAreaField('Body', validators=[DataRequired()])
    category = SelectField('Category', choices=categories, validators=[DataRequired()])
    submit = SubmitField('Post')

class CommentForm(FlaskForm):
    body = TextAreaField('Body', validators=[DataRequired()])
    submit = SubmitField('Post')

