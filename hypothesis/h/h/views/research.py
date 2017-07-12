# -*- coding: utf-8 -*-

import datetime
import itertools

import colander
import deform
import jinja2
from pyramid import httpexceptions
from pyramid import security
from pyramid.exceptions import BadCSRFToken
from pyramid.view import view_config, view_defaults

from h import accounts
from h import form
from h import i18n
from h.models import *
from h import session
from h.db import *
from h.accounts import schemas
from h.accounts.events import ActivationEvent
from h.accounts.events import PasswordResetEvent
from h.accounts.events import LogoutEvent
from h.accounts.events import LoginEvent
from h.emails import reset_password
from h.tasks import mailer
from h.util.view import json_view
from h._compat import urlparse
import json
from h import models
import csv

_ = i18n.TranslationString

@view_config(route_name='research_export', renderer='json')
def research_export_view(request):
    engine = request.registry['sqlalchemy.engine']
    session = Session(bind=engine)
    # Make queries.
    annotation_results = session.execute('SELECT annotation.userid AS userid, ' + \
        'annotation.target_uri AS uri, \
        annotation.target_selectors AS selectors, \
        annotation.text AS text, \
        annotation.created AS created_date, \
        annotation.updated AS updated_date, \
        annotation.tags AS tags, \
        annotation.deleted AS delete \
        FROM annotation').fetchall()
    results = {}
    rownum = 1
    for row in annotation_results:
        results[('row' + str(rownum))] = row2dict(row)
        rownum = rownum + 1

    return results


def row2dict(row):
    """
        Convert a RowProxy Object into a json row
    """
    d = {}
    for column in row.keys():
        if column == 'selectors':
            # tmp_json = json.dumps(row[column])
            tmp_json = row[column]
            d['annotation'] = str(tmp_json[2]['exact'])
        elif column == 'delete':
            print row[column]
            d['active'] = str(not bool(row['delete']))
        elif column == 'tags':
            d[column] = 'None' if (len(row[column]) == 0) else str(row[column][0])
        else:
            d[column] = str(row[column])
    return d