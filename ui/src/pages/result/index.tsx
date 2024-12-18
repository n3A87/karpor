import React, { useState, useEffect } from 'react'
import { Pagination, Empty, Divider, Tooltip, Tag } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ClockCircleOutlined } from '@ant-design/icons'
import queryString from 'query-string'
import classNames from 'classnames'
import SqlSearch from '@/components/sqlSearch'
import KarporTabs from '@/components/tabs/index'
import { utcDateToLocalDate } from '@/utils/tools'
import Loading from '@/components/loading'
import { ICON_MAP } from '@/utils/images'
import { searchSqlPrefix, tabsList } from '@/utils/constants'
import { useAxios } from '@/utils/request'

import styles from './styles.module.less'

const Result = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [pageData, setPageData] = useState<any>()
  const urlSearchParams = queryString.parse(location.search)
  const [searchType, setSearchType] = useState<string>('sql')
  const [searchParams, setSearchParams] = useState({
    pageSize: 20,
    page: 1,
    query: urlSearchParams?.query || '',
    total: 0,
  })

  function handleTabChange(value: string) {
    setSearchType(value)
  }

  function handleChangePage(page: number, pageSize: number) {
    getPageData({
      ...searchParams,
      page,
      pageSize,
    })
  }

  const { response, refetch, loading } = useAxios({
    url: '/rest-api/v1/search',
    manual: true,
  })

  useEffect(() => {
    if (response?.success) {
      setPageData(response?.data?.items || {})
      const objParams = {
        ...urlSearchParams,
        query: response?.successParams?.query || searchParams?.query,
      }
      const urlString = queryString.stringify(objParams)
      navigate(`${location?.pathname}?${urlString}`, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response])

  function getPageData(params) {
    refetch({
      option: {
        params: {
          query: `${searchSqlPrefix} ${params?.query || searchParams?.query}`,
          ...(searchType === 'sql' ? { pattern: 'sql' } : {}),
          page: params?.page || searchParams?.page,
          pageSize: params?.pageSize || searchParams?.pageSize,
        },
      },
    })

    setSearchParams({
      ...searchParams,
      ...params,
      total: response?.data?.total,
    })
  }

  useEffect(() => {
    getPageData(searchParams)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(inputValue) {
    setSearchParams({
      ...searchParams,
      query: inputValue,
    })
    getPageData({
      ...searchParams,
      query: inputValue,
      page: 1,
    })
  }

  const handleClick = (item: any, key: string) => {
    const nav = key === 'name' ? 'resource' : key
    const objParams = {
      from: 'result',
      deleted: item?.deleted,
      cluster: item?.cluster,
      apiVersion: item?.object?.apiVersion,
      type: key,
      kind: item?.object?.kind,
      namespace: item?.object?.metadata?.namespace,
      name: item?.object?.metadata?.name,
      query: searchParams?.query,
    }
    const urlParams = queryString.stringify(objParams)
    navigate(`/insightDetail/${nav}?${urlParams}`)
  }

  const handleTitleClick = (item: any, kind: string) => {
    const nav = kind === 'Namespace' ? 'namespace' : 'resource'
    const objParams = {
      from: 'result',
      deleted: item?.deleted,
      cluster: item?.cluster,
      apiVersion: item?.object?.apiVersion,
      type: nav,
      kind: item?.object?.kind,
      ...(nav === 'namespace'
        ? { namespace: item?.object?.metadata?.name }
        : { namespace: item?.object?.metadata?.namespace }),
      ...(nav === 'resource' ? { name: item?.object?.metadata?.name } : {}),
      query: searchParams?.query,
    }
    const urlParams = queryString.stringify(objParams)
    navigate(`/insightDetail/${nav}?${urlParams}`)
  }

  function renderEmpty() {
    return (
      <div
        style={{
          height: 500,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Empty />
      </div>
    )
  }

  function renderLoading() {
    return (
      <div
        style={{
          height: 500,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Loading />
      </div>
    )
  }

  function renderListContent() {
    return (
      <>
        <div className={styles.stat}>
          <div>
            {t('AboutInSearchResult')}&nbsp;
            {searchParams?.total}&nbsp;
            {t('SearchResult')}
          </div>
        </div>
        {pageData?.map((item: any, index: number) => {
          return (
            <div className={styles.card} key={`${item?.name}_${index}`}>
              {item?.deleted && (
                <div className={styles.delete_tag}>
                  <Tag color="error">{t('Delete')}</Tag>
                </div>
              )}
              <div className={styles.left}>
                <img
                  src={ICON_MAP?.[item?.object?.kind] || ICON_MAP.CRD}
                  alt="icon"
                />
              </div>
              <div className={styles.right}>
                <div
                  className={styles.top}
                  onClick={() => handleTitleClick(item, item?.object?.kind)}
                >
                  {item?.object?.metadata?.name || '--'}
                </div>
                <div className={styles.bottom}>
                  <div
                    className={styles.item}
                    onClick={() => handleClick(item, 'cluster')}
                  >
                    <span className={styles.api_icon}>Cluster</span>
                    <span className={styles.label}>
                      {item?.cluster || '--'}
                    </span>
                  </div>
                  <Divider type="vertical" />
                  <div className={classNames(styles.item, styles.disable)}>
                    <span className={styles.api_icon}>APIVersion</span>
                    <span className={styles.label}>
                      {item?.object?.apiVersion || '--'}
                    </span>
                  </div>
                  <Divider type="vertical" />
                  <div
                    className={styles.item}
                    onClick={() => handleClick(item, 'kind')}
                  >
                    <span className={styles.api_icon}>Kind</span>
                    <span className={styles.label}>
                      {item?.object?.kind || '--'}
                    </span>
                  </div>
                  <Divider type="vertical" />
                  {item?.object?.metadata?.namespace && (
                    <>
                      <div
                        className={styles.item}
                        onClick={() => handleClick(item, 'namespace')}
                      >
                        <span className={styles.api_icon}>Namespace</span>
                        <span className={styles.label}>
                          {item?.object?.metadata?.namespace || '--'}
                        </span>
                      </div>
                      <Divider type="vertical" />
                    </>
                  )}
                  <div className={classNames(styles.item, styles.disable)}>
                    <ClockCircleOutlined />
                    <Tooltip title={t('CreateTime')}>
                      <span className={styles.label}>
                        {utcDateToLocalDate(
                          item?.object?.metadata?.creationTimestamp,
                        ) || '--'}
                      </span>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div className={styles.footer}>
          <Pagination
            total={searchParams?.total}
            showTotal={(total: number, range: any[]) =>
              `${range?.[0]}-${range?.[1]} ${t('Total')} ${total} `
            }
            pageSize={searchParams?.pageSize}
            current={searchParams?.page}
            onChange={handleChangePage}
          />
        </div>
      </>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchTab}>
        <KarporTabs
          list={tabsList}
          current={searchType}
          onChange={handleTabChange}
        />
      </div>
      <SqlSearch
        sqlEditorValue={
          (searchParams?.query || urlSearchParams?.query) as string
        }
        handleSearch={handleSearch}
      />
      <div className={styles.content}>
        {loading
          ? renderLoading()
          : pageData && pageData?.length > 0
            ? renderListContent()
            : renderEmpty()}
      </div>
    </div>
  )
}

export default Result
