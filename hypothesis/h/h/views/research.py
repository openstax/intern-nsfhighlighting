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

try:
    from StringIO import StringIO # python 2
except ImportError:
    from io import StringIO # python 3

class CSVRenderer(object):
    def __init__(self, info):
        pass

    def __call__(self, value, system):
        """ Returns a plain CSV-encoded string with content-type
        ``text/csv``. The content-type may be overridden by
        setting ``request.response.content_type``."""

        request = system.get('request')
        if request is not None:
            response = request.response
            ct = response.content_type
            if ct == response.default_content_type:
                response.content_type = 'text/csv'

        fout = StringIO()
        writer = csv.writer(fout, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)

        writer.writerow(value.get('header', []))
        writer.writerows(value.get('rows', []))

        return fout.getvalue()



@view_config(route_name='csv_export', renderer='csv')
def test_renderer(request):
    
    engine = request.registry['sqlalchemy.engine']
    session = Session(bind=engine)
    # Make queries. The results will also be in order
    annotation_results = session.execute('SELECT annotation.userid AS userid, ' + \
        'annotation.target_uri AS uri, \
        annotation.target_selectors AS selectors, \
        annotation.created AS created_date, \
        annotation.updated AS updated_date, \
        annotation.tags AS tags, \
        annotation.text AS text, \
        annotation.deleted AS delete \
        FROM annotation').fetchall()

    # First row of the csv file
    header = ['User', 'Uri', 'Text', 'Created Date', 'Updated Date', \
             'Important', 'Critical', 'Question', 'Annotation', 'Active']
    rows = []
    for row in annotation_results:
        in_row = []
        for col in row.keys():
            if col == 'selectors':
                in_row.append(row[col][2]['exact'])
                continue
            if col == 'delete':
                in_row.append(str(not bool(row['delete'])))
                continue
            if col == 'tags':
                i = 'X'
                c = 'X'
                q = 'X'
                if row[col][0] == 'Important':
                    i = 'O'
                elif row[col][0] == 'Critical':
                    c = 'O'
                else:
                    q = 'O'
                in_row.append(i)
                in_row.append(c)
                in_row.append(q)
                continue

            in_row.append(row[col])
        rows.append(in_row)

    return {
       'header': header,
       'rows': rows
    }


@view_config(route_name='json_export', renderer='json')
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